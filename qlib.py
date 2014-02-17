
import numpy as np
from numpy.random import random,randint
from cgml.computational_graph import ComputationalGraph
from cgml.costs import sqerrCost
from cgml.optimizers import MSGD
import theano.tensor as T
import theano
        
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

        self.currCost = None

        
    def getValue(self,state,action):
        return self.Q([state],[action])[0]

        
    def getMaxValue(self,state):

        # List the values of the actions
        values = [self.getValue(state,action) for action
                  in xrange(self.nActions)]

        return np.max(values)

        
    def getGreedyAction(self,state):

        # List the values of the actions
        values = [self.getValue(state,action) for action
                  in xrange(self.nActions)]
        
        # Otherwise we pick the action that has the highest value
        return np.argmax(values)

        
    def getEpsilonGreedyAction(self,state):
        
        # If all the values are the same, or
        # if we choose to pick a random action
        if random() < self.epsilon:
            return randint(self.nActions)
        else:
            return self.getGreedyAction(state)

            
    def updateValueByDelayedReward(self, replayMemory, log = None):
        """Given a delayed reward and the sequence of past states
        (a.k.a replay memory), updates the corresponding values."""

        n = len(replayMemory)

        if log:
            log.write('Updating based on ' + str(n) + ' replay states\n')
        
        if n == 0:
            return

        states  = n * [None] 
        actions = n * [None]
        values  = n * [None]
            
        for i,memory in zip(xrange(n),replayMemory):
            
            states[i]  = memory.currState
            actions[i] = memory.currAction

            if log:
                log.write(str(i) + ': state ' + str(states[i]) +
                          ' and action ' + str(actions[i]) +
                          ' yields next state ' + str(memory.nextState) +
                          ' and reward ' + str(memory.currReward) + ' and ')
            
            if memory.isTerminal:
                values[i] = memory.currReward
            elif memory.nextState == None:
                values[i] = 0
            else:
                if log:
                    log.write('(getting max value) ')
                nextBestValue = self.getMaxValue(memory.currState)
                assert nextBestValue != None
                values[i] = memory.currReward + self.discountRate * nextBestValue

            if log:
                log.write('value ' + str(values[i]) + '\n')
                
        #if log:
        #    log.write('target value sequence is: ' + str(values) + '\n')
            
        self.currCost = self.update_Q(states,actions,values)

















