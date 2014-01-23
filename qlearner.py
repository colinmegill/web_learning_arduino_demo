import time 
import sys

def dummy(): 
	for i in range(0,10):
		sys.stdout.write("dummy process " + str(i+1) + "/10\n")
		time.sleep(0.2) 

	for line in sys.stdin:
		sys.stdout.write(line.rstrip() + ' BOOM\n')

	#var = sys.stdin.readlines()

	#sys.stdout.write(str(var) + '\n')

	for line in sys.stdin:
		sys.stdout.write('BOOM\n')

if __name__ =='__main__' : 
    dummy() 

