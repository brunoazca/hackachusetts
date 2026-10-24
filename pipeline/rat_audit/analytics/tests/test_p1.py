"""Synthetic calculation and fake-LLM tests; these do not validate a live provider."""
from copy import deepcopy
from unittest.mock import Mock

import pytest
from rat_audit.analytics import impact, research, unknowns
from rat_audit.analytics.common import MissingInput, public_note


def test_assessment_exact_strata_and_reproducible_estimate():
    rows=[]
    for i in range(20):
        rows += [(f'a{i}','02121','R1',1910,100,110,True,'fx'),
                 (f'b{i}','02121','R1',1915,100,105,False,'fx')]
    rows += [('unmatched','02121','R2',1910,100,9000,True,'fx')]
    result=impact.matched_assessment(rows)
    assert result==impact.matched_assessment(list(reversed(rows)))
    assert result['n']==20 and result['diff_pct']==pytest.approx(5)
    assert result['ci']==pytest.approx([5,5])
    assert impact.matched_assessment(rows[-1:])['insufficient']


def test_listings_no_missing_price_as_zero_and_no_invented_review_rate():
    result=impact.listing_comparison([(None,0,0,True),(100,5,1,True),(200,0,0,False)])
    assert result['near']['median_price_usd']==100 and result['near']['rat_mention_share']==.2
    assert result['elsewhere']['rat_mention_share'] is None


def test_program_requests_not_counted_as_sightings_even_program_only_month():
    result=impact.three_city_rates([('somerville','2026-01',12,'rodent_program'),
                                   ('boston','2026-01',10,'rodent'),('missing','2026-01',5,'rodent')],
                                  {'somerville':{'population':1000,'vintage':2020},'boston':{'population':500,'vintage':2010}})
    assert len(result)==2 and result[0]['per_1000_residents']==20
    assert result[1]['reports']==0 and result[1]['program_requests']==12 and result[1]['per_1000_residents']==0


def summary():
    return {'notes':[{'note':'Checked area; cause not recorded','source_id':'fx'}],
            'drivers':[{'category':'trash_storage','count':3,'source_ids':['fx']}],'source_ids':['fx']}


def test_ai_cache_reuses_draft_and_human_edits_survive_changed_evidence():
    draft=Mock(return_value=['Are containers sealed after collection?', 'Where are the entry points?'])
    base=summary(); cached,changed=unknowns.refresh(base,draft)
    assert changed and all(q['answer']=='unknown' for q in cached['unknowns'])
    base.update(cached)
    assert not unknowns.refresh(base,draft)[1] and draft.call_count==1
    base['unknowns'][0].update(answer='confirmed',edited=True)
    base['notes'].append({'note':'New inspection'})
    kept,_=unknowns.refresh(base,draft)
    assert kept['unknowns'][0]['answer']=='confirmed' and draft.call_count==1


@pytest.mark.parametrize('answer',[
    ['Can poison be placed here?', 'Are bins sealed?'], ['Only one question?'],
    ['Ask Inspector Smith to visit 123 Example Street?', 'Are bins sealed?'],
    ['Are bins sealed?', 'Are bins sealed?']])
def test_ai_invalid_or_private_output_is_rejected(answer):
    with pytest.raises(ValueError): unknowns.refresh(summary(),lambda *_:answer)


def test_no_configured_llm_is_explicit_and_no_ai_results_invented():
    with pytest.raises(MissingInput,match='configured LLM'): unknowns.refresh(summary())


def test_dated_research_is_labelled_and_cited():
    rows=research.rows()
    assert len(rows)==9
    assert all(r['stat']['evidence_kind']=='dated_research' and r['source_ids']==[research.SOURCE_ID] for r in rows)
    assert all('not recomputed' in r['caveat'] for r in rows)


def test_public_notes_remove_crm_metadata_and_misspelled_inspector_names():
    assert 'Example Name' not in public_note('Case Ref: xyz. Created by: Example Name')
    assert 'Smith' not in (public_note('Insepctor Smith visited 123 Example Street') or '')
