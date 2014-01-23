import copy
import numpy as np
from numpy.random import random_sample

def getNextState(state,idx,delta):
    nextState = copy.deepcopy(state)

    if 0 < nextState[idx] + delta < 255:
        nextState[idx] += delta
    return nextState

def relativeDistanceToTarget(state,targetSum):
    return 1.0 * np.abs( sum(state) - targetSum ) / targetSum
    
def isCloseToTarget(state,targetSum,th):

    if relativeDistanceToTarget(state,targetSum) < th:
        return True
    else:
        return False

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


class ControllerApplication(object):

    def __init__(self):

        # What target sum to reach
        self.targetSum = 200

        # What are the delta increments for the LEDs
        self.deltas = [1, 10, 50, 20]

        # How close to the true sum is close enough (in percentage)
        self.closenessThreshold = 0.05

        # Starting state (all LEDs turned off)
        self.currState = [0,0,0,0]

    def reset(self):
        self.currState = [0,0,0,0]
        
    # The controller app receives an action and updates the state accordingly
    def sendAction(self,action):

        # Action is a tuple of LED index and delta sign (more/less intensity)
        idx,sign = action

        # Controller knows about the increment magnitude
        delta = sign * self.deltas[idx]

        # The system reaches a new state
        self.currState = getNextState(self.currState,idx,delta)

    def recvReward(self):
        return isCloseToTarget(self.currState,self.targetSum,self.closenessThreshold)
        
    def recvState(self):
        return self.currState
        
        
class ValueFunction(object):
    
    def __init__(self):
        
        self.eps = 1e-3
        self.Q = {}
        
    def get(self,state,action):
        return self.Q.get( encode(state,action) ,self.eps )
        
    def update(self, state, action, reward, alpha = 0.1):
        h = encode(state,action)
        self.Q[h] = (1 - alpha) * self.Q.get(h,self.eps) + alpha * reward 


def updateValue(value,replayMemory,alpha, log = None):
    
    alpha = 0.3
    n = len(replayMemory)
    reward = 1.0 / ( 1 + len(replayMemory) )
    lastState = [-1,-1,-1,-1]
    for state,action in replayMemory:
        if state != lastState:
            value.update(state, action, reward, alpha = alpha)
            lastState = copy.deepcopy(state)

    if log:
        log.write('\t'.join(map(str,[n,reward])) + '\n')
