#!/usr/bin/env python -u 

import sys
import qlib
import io
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

parser.add_argument("--relDistanceTh",
                    metavar = '[0..1]',
                    type = float,
                    default = 0.05,
                    help = 'Relative distance, how close should we get to the goal.')

parser.add_argument("--epsilon",
                    metavar = '[0..1]',
                    type = float,
                    default = 0.1,
                    help = 'Randomization parameter in the epsilon-greedy exploration.')

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

# Keep track of how many episodes have been played
episodeIdx = 0
trainIdx = 0

while True:

    # We need to read lines like this, otherwise the lines get buffered
    try:
        line = inStream.readline()
    except:
        break

    # Read one line of input
    ID,currState,relDistance = io.parseLine(line)

    # If the state is close enough to the target...
    if relDistance < args.relDistanceTh:

        # Reward that we get
        reward = 1.0 - 1.0 * len(replayMemory) / args.replayMemorySize
        
        # We can update the value function based on the replay memory
        # if it exists
        if len(replayMemory) >= 1:
            value.updateValueByDelayedReward(replayMemory, reward, log = log)
            trainIdx += 1
            
        # And send a reset action back to the controller
        outStream.write('RESET_ACTION\n')
        outStream.flush()

        # Finish things up by erasing the replay memory,
        # so that the new episode can start
        replayMemory = []

        # Increment episode index
        episodeIdx += 1
        
    else:

        # If we are not yet close enough to the goal, sample new action
        action = value.getEpsilonGreedyAction(currState,args.actions)

        # Update replay memory
        replayMemory.append( (currState,action) )

        # If the maximum replay memory size is not yet reached...
        if len(replayMemory) < args.replayMemorySize:

            # Send the delta action to the controller
            msg = ' '.join(map(str,['DELTA_ACTION',action]))
            outStream.write(msg + '\n')
            outStream.flush()
            
    # If we have used too many state transitions,
    # We send a reset signal and start all over again
    if len(replayMemory) == args.replayMemorySize:

        # Send a reset action to the controller
        outStream.write('RESET_ACTION\n')
        outStream.flush()
        
        # And erase replay memory, because we'll start a new episode
        replayMemory = []

        # Increment episode index
        episodeIdx += 1


# If we need to save the model to file
if args.saveModel:
    value.save(args.saveModel)

















