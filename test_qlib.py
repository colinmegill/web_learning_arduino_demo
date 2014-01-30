#!/usr/bin/python

import qlib
import numpy as np

def isClose(x,y, eps = 1e-10):

    t = np.abs(x-y) < eps

    if not t:
        print x,y,eps
        
    return t

def test_getNextAction():

    epsilon = 0.1
    learnRate = 0.3
    discountRate = 0.5
    
    value = qlib.ValueFunction(epsilon = epsilon,
                               learnRate = learnRate,
                               discountRate = discountRate)

    stateActionPair1 = ([0,0,0,0], (1,1) )
    stateActionPair2 = ([0,1,0,0], (0,1) )

    state1,action1 = stateActionPair1
    state2,action2 = stateActionPair2
    
    actions = [(1,1),(0,1)]
    
    replayMemory = [stateActionPair1,stateActionPair2]

    reward = 100
    
    value.updateValueByDelayedReward(replayMemory,reward)

    n = 10000
    nTrue = 0
    for i in xrange(n):
        nextAction = value.getEpsilonGreedyAction(state1,actions)
        if nextAction == action1:
            nTrue += 1

    p_est  = 1.0 * nTrue / n
    p_true = 1.0 - epsilon / 2
    assert isClose(p_est,p_true, eps = 1e-2)

def test_updateValuefunction():

    epsilon      = 0.1
    learnRate    = 0.3
    discountRate = 0.5
    
    value = qlib.ValueFunction(epsilon = epsilon,
                               learnRate = learnRate,
                               discountRate = discountRate)

    state0,action0 = [0,0,0,0],[0,1]
    state1,action1 = [1,0,0,0],[1,1]
    state2,action2 = [1,1,0,0],[2,1]
    state3,action3 = [1,1,1,0],[3,1]
    state4,action4 = [1,1,1,1],[0,1]
    
    replayMemory = [ (state0,action0),
                     (state1,action1),
                     (state2,action2),
                     (state3,action3),
                     (state4,action4) ]
    
    reward = 1.0
    
    value.updateValueByDelayedReward(replayMemory,reward)

    gamma = learnRate * discountRate
    
    assert isClose( value.getValue(state4,action4),
                    gamma**0 * learnRate * reward )

    assert isClose( value.getValue(state3,action3),
                    gamma**1 * learnRate * reward )

    assert isClose( value.getValue(state2,action2),
                    gamma**2 * learnRate * reward )

    assert isClose( value.getValue(state1,action1),
                    gamma**3 * learnRate * reward )

    assert isClose( value.getValue(state0,action0),
                    gamma**4 * learnRate * reward )




















