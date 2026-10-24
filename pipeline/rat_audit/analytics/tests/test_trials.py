import random
import pytest
from hypothesis import given, strategies as st
from rat_audit.analytics.trials import design, result


def candidates(n=30):
    return [{'id':f'site_{i:03}','due':True,'neighborhood':['a','b'][i%2],
             'prior_returns_bucket':'1','trash_tickets_12mo':i%3} for i in range(n)]


@given(st.integers(-100000,100000))
def test_pairs_match_disjoint_and_seed_reproducible(seed):
    c=candidates(); a=design(c,6,'sealed_containers',seed)
    random.Random(4).shuffle(c)
    assert design(c,6,'sealed_containers',seed)==a
    by_id={s['id']:s for s in c}; ids=[]
    for p in a['pairs']:
        t,b=by_id[p['treatment_site']],by_id[p['comparison_site']]
        assert t['neighborhood']==b['neighborhood']==p['match_keys']['neighborhood']
        assert t['prior_returns_bucket']==b['prior_returns_bucket']
        assert t['trash_tickets_12mo']==b['trash_tickets_12mo']
        ids += [t['id'],b['id']]
    assert len(ids)==len(set(ids))==12


def test_active_trials_excluded_and_shortfall_errors():
    c=candidates(4); c[0]['open_trial']=True
    with pytest.raises(ValueError,match='matched pairs'): design(c,2,'sealed_containers',1)
    with pytest.raises(ValueError,match='lane'): design(c,1,'rodenticide',1)


def test_pending_trial_has_no_success_estimate():
    assert result([False],[False],False)['status']=='pending'
    r=result([True,False],[False,False],True)
    assert r['treatment']['rate']==.5 and r['comparison']['rate']==0
    assert r['treatment']['ci_low']<.5<r['treatment']['ci_high']
