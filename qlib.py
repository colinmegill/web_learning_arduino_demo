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

    def updateValueByDelayedReward(self, replayMemory, reward, log = None):
        """Given a delayed reward and the sequence of past states (a.k.a replay memory),
        updates the corresponding values."""

        n = len(replayMemory)

        if n == 0:
            raise Exception("Cannot update the value function with empty replay memory!")
        
        state_next,action_next = replayMemory[-1]
        h_next = encode(state_next,action_next)
        
        self.Q[h_next] = self.Q.get(h_next,0) + self.learnRate * reward

        if n == 1:
            return
            
        for i in xrange(n-2,-1,-1):

            state,action = replayMemory[i]
            h = encode(state,action)

            # If the state in replay memory hasn't changed,
            # we won't update twice
            if h == h_next:
                continue

            delta = self.Q.get(h_next,0) - self.Q.get(h,0)

            # How much is the new Q-value
            Qnew = self.Q.get(h,0) + self.learnRate * ( 0 + self.discountRate * delta )

            # Clamp the new Q-value between [0,1]
            self.Q[h] = np.max([ 0.0, np.min([ Qnew , 1.0 ]) ])

            h_next = copy.deepcopy(h)
            
            if log:
                log.write('\t'.join(map(str,[i,self.Q.get(h,0)])) + '\n')















