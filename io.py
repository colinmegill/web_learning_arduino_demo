

def parseLine(line):

    try:
        ID,led0,led1,led2,led3,relDistance = line.rstrip().split(' ')
    except:
        raise Exception('Incorrectly formatted input line: ' + line +'.\n' +
                        'Are you sure it has enough fields?')

    if ID != 'STATE':
        raise Exception('ID is not STATE: ' + ID + ' found instead')
        
    currState = [led0,led1,led2,led3]    

    try:
        relDistance = float(relDistance)
    except:
        raise Exception('Relative distance ' + relDistance + ' cannot be interpreted as a float')

    return ID,currState,relDistance
