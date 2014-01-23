import copy
import numpy as np
from numpy.random import random_sample

def drawFromDistribution(values, probabilities):
    bins = np.add.accumulate(probabilities)
    return values[np.digitize(random_sample(1), bins)]
    
def encode(state,action):
    return str(state) + ' + ' + str(action)

def getNextAction(value,state,actions):

    qvec = [value.get(state,action) for action in actions]

    s = sum(qvec)
    
    probabilities = [q / s for q in qvec]

    nextAction = drawFromDistribution(actions,probabilities)

    return nextAction

        
class ValueFunction(object):
    
    def __init__(self):
        
        self.eps = 1e-3
        self.Q = {}
        
    def get(self,state,action):
        return self.Q.get( encode(state,action) ,self.eps )
        
    def update(self, replayMemory, alpha, log = None):
        
        n = len(replayMemory)
        reward = 1.0 / ( 1 + n )
        lastState = 4 * [None]

        for state,action in replayMemory:

            if state != lastState:

                h = encode(state,action)
                
                self.Q[h] = (1 - alpha) * self.Q.get(h,self.eps) + alpha * reward 

                lastState = copy.deepcopy(state)

        if log:
            log.write('\t'.join(map(str,[n,reward])) + '\n')
