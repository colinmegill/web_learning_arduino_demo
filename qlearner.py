#!/usr/bin/python

import sys
import qlib
import io
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--relDistanceTh",type=float,default=0.05)
parser.add_argument("--learnRate",type=float,default=0.3)
parser.add_argument("--replayMemorySize",type=int,default=100)

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

    if relDistance < args.relDistanceTh:

        qlib.updateValue(value, replayMemory, args.learnRate, log = log)
        outStream.write('RESET_ACTION\n')
        replayMemory = []

    else:
        
        action = qlib.getNextAction(value,currState,actions)
        replayMemory.append( (currState,action) )

        if len(replayMemory) < args.replayMemorySize:
            outStream.write(' '.join(map(str,['DELTA_ACTION',action[0],action[1]])) + '\n')
        else:
            outStream.write('RESET_ACTION\n')
            replayMemory = []











