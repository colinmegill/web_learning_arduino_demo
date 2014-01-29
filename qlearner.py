#!/usr/bin/python

import sys
import qlib
import io
import argparse

parser = argparse.ArgumentParser()

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
                    metavar = '[1..n]',
                    type = int,
                    default = 100,
                    help = 'How long training sequences can we hold at most.')

args = parser.parse_args()

inStream  = sys.stdin
outStream = sys.stdout

value = qlib.ValueFunction(epsilon = args.epsilon,
                           learnRate = args.learnRate,
                           discountRate = args.discountRate)

actions = [(idx,1) for idx in range(4)] + [(idx,-1) for idx in range(4)]

log = open('log','w')

replayMemory = []

for line in inStream:

    # Read one line of input
    ID,currState,relDistance = io.parseLine(line)

    log.write( str(currState) + ' ' + str(relDistance) + '\n')
    
    # If the state is close enough to the target...
    if relDistance < args.relDistanceTh:

        # Currently we consider fixed reward.
        # This should really come from the controller application
        reward = 1.0
        
        # We can update the value function based on the replay memory
        value.updateValueByDelayedReward(replayMemory, reward, log = log)

        # And send a reset action back to the controller
        log.write('RESET_ACTION\n')
        outStream.write('RESET_ACTION\n')
        outStream.flush()

        # Finish things up by erasing the replay memory, so that the new episode can start
        replayMemory = []

    else:

        # If we are not yet close enough to the goal, sample new action
        action = value.getEpsilonGreedyAction(currState,actions)

        # Update replay memory
        replayMemory.append( (currState,action) )

        # If the maximum replay memory size is not yet reached...
        if len(replayMemory) < args.replayMemorySize:

            # Send the delta action to the controller
            msg = ' '.join(map(str,['DELTA_ACTION',action[0],action[1]])) + '\n'
            log.write(msg)
            outStream.write(msg)
            outStream.flush()

        else:

            # Otherwise send a reset action to the controller
            log.write('RESET_ACTION\n')
            outStream.write('RESET_ACTION\n')
            outStream.flush()

            # And erase replay memory, because we'll start a new episode
            replayMemory = []










