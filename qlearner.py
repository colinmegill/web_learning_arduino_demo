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

parser.add_argument("--learnRate",
                    metavar = '[0..1]',
                    type = float,
                    default = 0.3,
                    help = 'How much weight is given to the reward obtained by the new training sequence.')

parser.add_argument("--replayMemorySize",
                    metavar = '[1..n]',
                    type = int,
                    default = 100,
                    help = 'How long training sequences can we hold at most.')

args = parser.parse_args()

inStream  = sys.stdin
outStream = sys.stdout

value = qlib.ValueFunction()

actions = [(idx,1) for idx in range(4)] + [(idx,-1) for idx in range(4)]

log = open('log','w')

replayMemory = []

for line in inStream:

    # Read one line of input
    ID,currState,relDistance = io.parseLine(line)

    # If the state is close enough to the target...
    if relDistance < args.relDistanceTh:

        # We can update the value function based on the replay memory
        value.update(replayMemory, args.learnRate, log = log)

        # And send a reset action back to the controller
        outStream.write('RESET_ACTION\n')

        # Finish things up by erasing the replay memory, so that the new episode can start
        replayMemory = []

    else:

        # If we are not yet close enough to the goal, sample new action
        action = qlib.getNextAction(value,currState,actions)

        # Update replay memory
        replayMemory.append( (currState,action) )

        # If the maximum replay memory size is not yet reached...
        if len(replayMemory) < args.replayMemorySize:

            # Send the delta action to the controller
            outStream.write(' '.join(map(str,['DELTA_ACTION',action[0],action[1]])) + '\n')

        else:

            # Otherwise send a reset action to the controller
            outStream.write('RESET_ACTION\n')

            # And erase replay memory, because we'll start a new episode
            replayMemory = []










