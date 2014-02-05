#!/usr/bin/env python -u 

import math
import json
import sys
import qlib
import argparse

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
                    default = 0.0001,
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

parser.add_argument("--loadModel",
                    metavar = '<file>',
                    type = str,
                    default = None,
                    help = 'Load model from file.')

parser.add_argument("--saveModel",
                    metavar = '<file>',
                    type = str,
                    default = None,
                    help = 'Save model to file.')


# Parse arguments
args = parser.parse_args()

# Stream for reading from
inStream  = sys.stdin

# Stream for writing to.
# NOTE: stream flushes everything it gets
outStream = sys.stdout 

# If model needs to be loaded from file
if args.loadModel:
    value = qlib.ValueFunction.load(args.loadModel)

else:
    # Define a value function
    value = qlib.ValueFunction( nStateDims   = args.nStateDims,
                                epsilon      = args.epsilon,
                                learnRate    = args.learnRate,
                                discountRate = args.discountRate )


if len(args.actions) == 0:
    raise Exception("No actions provided!")
    
# Open log for writing, unbuffered
log = open('log','w', 0)

# What is the sequence of state-action pairs in the episode
replayMemory = []

cumReward = 0.0

idx = 0

while True:
    
    # We need to read lines like this, otherwise the lines get buffered
    try:
        line = inStream.readline().rstrip()
    except:
        break

    if line is None:
        break

    # log.write(line + '\n')
      
    #value.learnRate = 0.01 + args.learnRate * math.exp( - args.epsilonDecayRate * idx)
  
    idx += 1

    ID = line.split(' ')[0]

    if ID == 'STATE':

        currState = line.split(' ')[1:]

        if len(currState) != args.nStateDims:
            raise Exception("Input state '" + currState + "' does not have " +
                            str(args.nStateDims) + " elements!")
        
        # If we are not yet close enough to the goal, sample new action
        action = value.getEpsilonGreedyAction(currState,args.actions)
        
        # Update replay memory
        replayMemory.append( (currState,action) )
        
        # Send the delta action to the controller
        msg = ' '.join(map(str,['DELTA_ACTION',action]))
        outStream.write(msg + '\n')
        outStream.flush()
            
    elif ID == 'REWARD':

        cumReward += float(line.split(' ')[1])

        n = len(replayMemory)
        
        # We can update the value function based on the replay memory
        # if it exists
        if n >= 1:
            value.updateValueByDelayedReward(replayMemory, cumReward)

            msg = 'INFO ' + json.dumps({ 'nStatesExplored' : len(value.Q) })
            
            outStream.write(msg + '\n')
            outStream.flush()
            log.write(msg + '\n')
            
    elif ID == 'NEW_EPISODE':

        replayMemory = []
        cumReward = 0.0

    else:
        break


# If we need to save the model to file
if args.saveModel:
    value.save(args.saveModel)

















