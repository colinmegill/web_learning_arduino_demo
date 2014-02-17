#!/usr/bin/python

import copy
import json
import sys
import qlib
import argparse
import numpy as np

parser = argparse.ArgumentParser()

parser.add_argument("--nStateDims",
                    metavar = '<int>',
                    type = int,
                    default = 4,
                    help = 'How many elements in the state vector.')

parser.add_argument("--actions",
                    metavar = "a1 a2 ... ak",
                    nargs = '+',
                    type = str,
                    default = [],
                    help = 'A list of actions.')

parser.add_argument("--epsilon",
                    metavar = '[0..1]',
                    type = float,
                    default = 0.1,
                    help = 'Randomization parameter in the epsilon-greedy exploration.')

parser.add_argument("--epsilonDecayRate",
                    metavar = '[0..1]',
                    type = float,
                    default = 0.00001,
                    help = 'How much the epsilon term decays over time.')

parser.add_argument("--learnRate",
                    metavar = '[0..1]',
                    type = float,
                    default = 0.3,
                    help = 'How much weight is given to the reward obtained by the new training sequence.')

parser.add_argument("--discountRate",
                    metavar = '[0..1]',
                    type = float,
                    default = 0.1,
                    help = 'How much future values are discounted during update by delayed reward.')

parser.add_argument("--replayMemorySize",
                    metavar = '[1,2,3,...]',
                    type = int,
                    default = 100,
                    help = 'How long training sequences can we hold at most.')

parser.add_argument("--miniBatchSize",
                    metavar = '[1,2,3,...]',
                    type = int,
                    default = 5,
                    help = 'How many randomly drawn samples we draw from replay memory.')


# Parse arguments
args = parser.parse_args()

# Stream for reading from
inStream  = sys.stdin

# Stream for writing to.
# NOTE: stream flushes everything it gets
outStream = sys.stdout 

# Define a value function
value = qlib.ValueFunctionMLP( nStateDims   = args.nStateDims,
                               nActions     = len(args.actions),
                               epsilon      = args.epsilon,
                               learnRate    = args.learnRate,
                               discountRate = args.discountRate )


if len(args.actions) == 0:
    raise Exception("No actions provided!")
    
# Open log for writing, unbuffered
log = open('log','w', 0)

class Memory(object):

    def __init__(self,
                 currState,
                 currAction,
                 currReward,
                 isTerminal,
                 nextState = None):

        self.currState  = currState
        self.currAction = currAction
        self.currReward  = currReward
        self.isTerminal = isTerminal
        self.nextState  = nextState

    def __str__(self):

        ret = ""
        ret += " s_t: " + " ".join(map(str,self.currState))
        ret += " a_t: " + str(self.currAction)
        ret += " r_t: " + str(self.currReward)
        ret += " isTerm: " + str(self.isTerminal)
        if self.nextState != None:
            ret += " s_t_1: " + " ".join(map(str,self.nextState))
        else:
            ret += " s_t_1: " + str(self.nextState)
        return ret
        
def drawSample(replayMemory,n):
    return [replayMemory[i]
            for i in np.random.choice(len(replayMemory),size = n)
            if replayMemory[i] != None]
        
                                                
# Stores a sampled sequence of state-action pairs 
replayMemory = args.replayMemorySize * [None]

idx = 0

while True:
    
    # We need to read lines like this, otherwise the lines get buffered
    try:
        line = inStream.readline().rstrip()
    except:
        break

    if line is None:
        break

    replayMemoryIdx = idx % args.replayMemorySize
        
    #log.write('received ' + line + '\n')
      
    obj = json.loads(line)

    if obj.get('state','NA') == 'NA':
        raise Exception('The learner must receive a state')

    if obj.get('reward','NA') == 'NA':
        raise Exception('The learner must receive a reward')

    if obj.get('isTerminal','NA') == 'NA':
        raise Exception('The learner must know if the state is terminal or not')
    
    currState = np.array(obj['state'])
    
    if len(currState) != args.nStateDims:
        msg = "Input state '" + str(currState) + "' does not have " + str(args.nStateDims) + " elements!"
        log.write(msg + '\n')
        raise Exception(msg)

    if idx > 0:
        lastReplayMemoryIdx = (idx - 1) % args.replayMemorySize
        replayMemory[lastReplayMemoryIdx].nextState = copy.deepcopy(currState)
        
    # If we are not yet close enough to the goal, sample new action
    currAction = value.getEpsilonGreedyAction(currState)

    currReward = obj['reward']

    isTerminal = obj['isTerminal']
    
    # Update replay memory
    replayMemory[replayMemoryIdx] = Memory(currState,
                                           currAction,
                                           currReward,
                                           isTerminal)
    
    # Send the delta action to the controller
    outStream.write(json.dumps({'action':args.actions[currAction]}) + '\n')
    outStream.flush()

    #if (idx % args.miniBatchSize) == 0:
    if log:
        value.updateValueByDelayedReward(drawSample(replayMemory,
                                                    args.miniBatchSize),
                                         log = None)

    #if log and (idx % 100) == 0:
    #    log.write('Replay memory stored:\n')
    #    for i in xrange(len(replayMemory)):
    #        log.write(str(i) + ": " + str(replayMemory[i]) + '\n')

    if log:
        log.write(str(value.currCost) + '\n')
    
    idx += 1


















