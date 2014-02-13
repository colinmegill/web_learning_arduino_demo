
import copy
import numpy as np
from numpy.random import random,randint
from cgml.computational_graph import ComputationalGraph
from cgml.costs import sqerrCost
from cgml.optimizers import MSGD
import theano.tensor as T
import theano
import math
        
class ValueFunctionMLP(object):

    def __init__(self,
                 nStateDims = None,
                 nActions = None,
                 epsilon = None,
                 learnRate = None,
                 discountRate = None):
        
        self.epsilon      = epsilon
        self.learnRate    = learnRate
        self.discountRate = discountRate
        self.nActions     = nActions
        
        states  = T.dmatrix('states')
        actions = T.lvector('actions')
        values  = T.dvector('values')

        model = ComputationalGraph(states,'qlearn_mlp.cg')

        assert model.n_in  == nStateDims
        assert model.n_out == nActions
        
        self.Q = theano.function(inputs  = [states,actions],
                                 outputs = model.output[T.arange(actions.shape[0]),actions])

        cost = sqerrCost(model.dropoutOutput[T.arange(actions.shape[0]),actions],values)
        
        optimizer = MSGD(cost      = cost,
                         params    = model.params,
                         learnRate = self.learnRate)
        
        self.update_Q = theano.function(inputs  = [states,actions,values],
                                        outputs = cost,
                                        updates = optimizer.updates)
        
    def getValue(self,state,action):
        return self.Q([state],[action])[0]

    def getEpsilonGreedyAction(self,state):

        # List the values of the actions
        values = [self.getValue(state,action) for action in xrange(self.nActions)]

        # If all the values are the same, or
        # if we choose to pick a random action
        if len(set(values)) == 1 or random() < self.epsilon:
            return randint(self.nActions)
        else:

            # Otherwise we pick the action that has the highest value
            return np.argmax(values)
            
    def updateValueByDelayedReward(self, replayMemory, reward):
        """Given a delayed reward and the sequence of past states
        (a.k.a replay memory), updates the corresponding values."""

        n = len(replayMemory)

        if n == 0:
            raise Exception("Cannot update the value function " +
                            "with empty replay memory!")
            
        state,action = replayMemory[-1]

        # When the reward is negative, we only reinforce the model
        # to not repeat that last move
        #if reward < 0:
        #    self.update_Q([state],[action],[reward])
        #    return
            
        # If the reward is positive, we want to reinforce the
        # whole replay memory
            
        Qnew = reward 

        states  = n * [None] 
        actions = n * [None]
        values  = n * [None]

        states[-1]  = copy.deepcopy(state)
        actions[-1] = copy.deepcopy(action)
        values[-1]  = copy.deepcopy(Qnew)
        
        for i in xrange(n-2,-1,-1):

            state,action = replayMemory[i]

            states[i]  = copy.deepcopy(state)
            actions[i] = copy.deepcopy(action)
            values[i]  = self.discountRate * values[i+1]
            
        for i in xrange(int(math.ceil( np.abs(reward) * 5 ))):
            self.update_Q(states,actions,values)

















