import json
from dataclasses import replace
from datetime import date, timedelta

import pytest
from hypothesis import given, settings, strategies as st
from rat_audit.analytics.common import dedupe_reports, recurrence_flags, local_date
from rat_audit.analytics.sites import _labels, case_summary, group_sites, legal_recommendations, rank_sites, recommend, seasonal_factors
from rat_audit.analytics.outcomes import compute, episodes
from .helpers import T0, rep


def test_dedupe_ids_timestamps_duplicate_tag_and_bulk():
    rs=[rep(1),rep(1),rep(2),rep(3,day=5,tag='duplicate')]
    rs += [rep(10+i,key='bulk',day=9,hour=i) for i in range(6)]
    kept,stats=dedupe_reports(rs)
    assert stats['dup_id']==1 and stats['dup_timestamp']==1 and stats['tag_duplicate']==1
    assert stats['bulk_collapsed']==5 and [r.id for r in kept]==['fx:1','fx:10']


def test_four_same_day_reports_are_not_bulk():
    assert len(dedupe_reports([rep(i,hour=i) for i in range(4)])[0])==4


@pytest.mark.parametrize('day,expected',[(1,False),(2,True),(61,True),(62,False)])
def test_return_window(day,expected):
    assert recurrence_flags([rep(1),rep(2,day=day,closed_after=None)])==[False,expected]


def test_open_case_cannot_start_a_return():
    assert recurrence_flags([rep(1,closed_after=None),rep(2,day=10,closed_after=None)])==[False,False]


def test_site_membership_not_address_controls_returns():
    rs=[replace(rep(1,key='a'),site_id='cluster'),replace(rep(2,key='b',day=10),site_id='cluster')]
    assert compute(rs,date(2026,1,1))['by_tag']['monitoring']['n_recurred']==1
    with pytest.raises(ValueError,match='cluster membership'):
        group_sites([replace(rs[0],site_id=None)],date(2026,1,1))


@settings(max_examples=100,deadline=None)
@given(st.lists(st.tuples(st.integers(0,3),st.integers(0,400),st.one_of(st.none(),st.integers(0,30))),min_size=1,max_size=40))
def test_returns_bounded_and_rank_deterministic(spec):
    rs=[rep(i,key=f'k{k}',day=d,closed_after=c) for i,(k,d,c) in enumerate(spec)]
    a,_=group_sites(rs,date(2026,10,23)); b,_=group_sites(list(reversed(rs)),date(2026,10,23))
    assert [(s['id'],s['rank']) for s in a]==[(s['id'],s['rank']) for s in b]
    assert all(0<=s['recurrence_count']<=s['report_count']-1 and 'score' not in s for s in a)


def test_due_first_then_recent_returns():
    items=[{'id':'a','due':False,'returns_12mo':100,'report_count':200,'days_since_last':0},
           {'id':'b','due':True,'returns_12mo':2,'report_count':3,'days_since_last':3},
           {'id':'c','due':True,'returns_12mo':3,'report_count':4,'days_since_last':5}]
    assert [s['id'] for s in rank_sites(items)]==['c','b','a']


def test_due_threshold_and_window():
    r=rep(1); base=[{'prior_returns_bucket':'0','n':100,'rate':.25,'threshold':.25}]
    for lag,expected in [(0,True),(60,True),(61,False),(-1,False)]:
        assert group_sites([r],r.closed_day+timedelta(days=lag),base)[0][0]['due']==expected
    assert not group_sites([r],r.closed_day,[{**base[0],'n':0,'rate':None}])[0][0]['due']


def _site(tags):
    return group_sites([rep(i,day=i*10,tag=tag) for i,tag in enumerate(tags)],date(2026,1,1))[0][0]


ADJ={'id':'vacant:fx','pid':'fx','land_use':'Res Land','source_id':'fx-assess','distance_m':22.0}
DRIVERS=[{'type':'incident','category':'trash_storage','count':4,'source_ids':['fx-311']}]
LABELS=_labels()


def test_five_rules_first_match_and_untried_action():
    r=recommend(_site(['monitoring']*3),DRIVERS,None,ADJ,None,LABELS)
    assert len(r)==1 and r[0]['rule']=='escalate' and r[0]['action_tag']=='citation'
    assert recommend(_site(['citation','monitoring','inspection','monitoring']),[],None,None,None,LABELS)[0]['action_tag']=='abatement_order'
    assert recommend(_site(['citation','abatement_order','monitoring','monitoring','monitoring']),DRIVERS,None,ADJ,None,LABELS)[0]['rule']=='adjacent_lot'
    assert recommend(_site(['baiting']*3),DRIVERS,None,None,None,LABELS)[0]['rule']=='containers'
    s=_site(['baiting']*3); s['reports'][-1]=replace(s['reports'][-1],cause_tag='sewer')
    assert recommend(s,[],None,None,None,LABELS)[0]['rule']=='sewer'
    assert recommend(_site(['baiting']*3),[],None,None,None,LABELS)[0]['rule']=='inspect_cause'


def test_escalation_needs_return_after_each_action():
    s=group_sites([rep(i,day=i*100) for i in range(3)],date(2026,1,1))[0][0]
    assert recommend(s,[],None,None,None,LABELS)[0]['rule']=='inspect_cause'


@given(st.sampled_from(['poison','rodenticide','baiting','pesticides']),st.sampled_from(['sanitation','exclusion','enforcement','referral']))
def test_final_filter_blocks_forbidden_recommendation(word,lane):
    assert not legal_recommendations([{'lane':lane,'action':'Use '+word}])
    assert not legal_recommendations([{'lane':'other','action':'Do something'}])


def test_summary_notes_speed_and_return_markers():
    rs=[replace(rep(i,day=i*10,closed_after=0),note='Inspector Smith visited 123 Example Street',cause_tag='trash') for i in range(6)]
    s=group_sites(rs,date(2025,6,1))[0][0]
    meta={r.id:{'member_ids':[r.id],'address_block':'Example St, 02121'} for r in rs}
    summary=case_summary(s,date(2025,6,1),{'monitoring':2},{m:1 for m in range(1,13)},meta,[],None,None)
    assert len(summary['notes'])==5 and summary['speed']['same_day_share']==1
    assert summary['speed']['by_action']['monitoring']['citywide_median_days']==2
    assert summary['timeline'][0]['closure_followed_by_return'] and not summary['timeline'][-1]['closure_followed_by_return']
    assert 'Smith' not in json.dumps(summary,default=str) and '123 Example' not in json.dumps(summary,default=str)


def test_base_rates_no_future_information_and_censoring():
    rs=[rep(1,day=0),rep(2,day=10),rep(3,day=20)]
    observed=local_date(T0)+timedelta(days=75)
    es=episodes(rs,observed)
    assert [e['prior_returns_bucket'] for e in es]==['0','1','2']
    assert [e['observed'] for e in es]==[True,True,False]
    bases=compute(rs,observed)['base_rates']
    assert bases[0]['n']==1 and bases[0]['rate']==1 and bases[2]['n']==0 and bases[2]['rate'] is None


def test_seasonality_excludes_partial_current_year():
    old=[replace(rep(i),opened_at=T0.replace(year=2024,month=1)) for i in range(3)]
    new=[replace(rep(i+5),opened_at=T0.replace(year=2025,month=7)) for i in range(50)]
    assert seasonal_factors(old+new,date(2025,10,1))[1]==12
