### Storages
A storage is an implementation of the [AbstractFileStorage]{@link AbstractFileStorage} class. It handles the basic 
operations for interacting with files. A storage can retrieve a [FileNode]{@link FileNode} describing each file and 
perform operations on a file given its FileNode. Directories are also files that contain an array of 
FileNodes encoded to a JSON string. To create a storage, extend AbstractFileStorage and 
implement all of the abstract methods. 

### FileSystems
A [FileSystem]{@link FileSystem} is a 