#!/usr/bin/python

import qlib

def test_ValueFunction():

    value = qlib.ValueFunction()

    replayMemory = [( [0,0,0,0] , (1,1) ),
                    ( [0,1,0,0] , (0,1) )]

    assert len(value.Q.keys()) == 0

    assert value.get([0,0,0,0],(1,1)) == value.eps

    alpha = 0.3
    
    value.update(replayMemory,alpha)










