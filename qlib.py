
import json
import copy
import numpy as np
from numpy.random import random,randint
    
def encode(state,action):
    return str(state) + ' + ' + str(action)
        
class ValueFunction(object):
    
    def __init__(self,
                 nStateDims = None,
                 epsilon = None,
                 learnRate = None,
                 discountRate = None):

        self.epsilon   = epsilon
        self.learnRate = learnRate
        self.discountRate = discountRate
        
        self.Q = {}
        
    def getValue(self,state,action):
        return self.Q.get( encode(state,action) , 0 )

    def getEpsilonGreedyAction(self,state,actions):

        n = len(actions)

        if n == 0:
            raise Exception("ValueFunction.getEpsilonGreedyAction() expects at least one candidate action!")

        # List the values of the actions
        values = [self.getValue(state,action) for action in actions]

        # If the values are all negligible or
        # if we choose to pick a random action
        if sum(values) < 1e-10 or random() < self.epsilon:
            return actions[randint(n)]
        else:

            # Otherwise we pick the action that has the highest value
            return actions[np.argmax(values)]

            
    def setQValue(self,state,action,Qnew):
        """ Assigns new Q-value, which is clamped between [0,1]"""
        self.Q[ encode(state,action) ] = np.max([ 0.0, np.min([ Qnew , 1.0 ]) ])


    def getQValue(self,state,action):
        """ Retrieves Q-value, and defaults to 0"""
        return self.Q.get( encode(state,action), 0 )

        
    def updateValueByDelayedReward(self, replayMemory, reward, log = None):
        """Given a delayed reward and the sequence of past states
        (a.k.a replay memory), updates the corresponding values."""

        n = len(replayMemory)

        if n == 0:
            raise Exception("Cannot update the value function " +
                            "with empty replay memory!")

        if log:
            log.write(str(n) + ' ' + str(reward) + '\n')
            
        state_next,action_next = replayMemory[-1]

        Qcurr = self.getQValue(state_next,action_next)
        
        Qnew = Qcurr + self.learnRate * reward
        
        self.setQValue(state_next,action_next,Qnew)
        
        if n == 1:
            return
            
        for i in xrange(n-2,-1,-1):

            state,action = replayMemory[i]

            # If the state in replay memory hasn't changed,
            # we won't update using it twice
            if state == state_next:
                state_next  = copy.deepcopy(state)
                action_next = copy.deepcopy(action)
                continue

            Qnext = self.getQValue(state_next,action_next)
            Qcurr = self.getQValue(state,action)

            delta = Qnext - Qcurr
            
            # How much is the new Q-value
            Qnew = Qcurr + self.learnRate * ( 0 + self.discountRate * delta )

            # Set new Q-value
            self.setQValue(state,action,Qnew)

            state_next  = copy.deepcopy(state)
            action_next = copy.deepcopy(action)

    def save(self,fileName):

        bundle = { 'epsilon'      : self.epsilon,
                   'learnRate'    : self.learnRate,
                   'discountRate' : self.discountRate,
                   'Q'            : self.Q }

        json.dump(bundle, open(fileName,'w'), indent = 2)

    @classmethod
    def load(cls,fileName):

        bundle = json.load(open(fileName,'r'))

        obj = cls(epsilon   = bundle['epsilon'],
                  learnRate = bundle['learnRate'],
                  discountRate = bundle['discountRate'])

        obj.Q = bundle['Q']

        return obj
        
















