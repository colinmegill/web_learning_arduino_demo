#!/usr/bin/python

import qlib
import numpy as np

def isClose(x,y):
    return np.abs(x-y) < 1e-10

def test_ValueFunction():
    
    value = qlib.ValueFunction()
    
    stateActionPair1 = ([0,0,0,0], (1,1) )
    stateActionPair2 = ([0,1,0,0], (0,1) )
    
    replayMemory = [stateActionPair1,stateActionPair2]

    assert len(value.Q.keys()) == 0

    state1,action1 = stateActionPair1
    state2,action2 = stateActionPair2
    
    alpha = 0.3
    
    value.update(replayMemory,alpha)

    assert isClose( value.get(state1,action1) , (1-alpha) * value.eps + alpha / (1 + 2) )
    assert isClose( value.get(state2,action2) , (1-alpha) * value.eps + alpha / (1 + 2) )

















