/*
   Copyright 2016 The Trustees of University of Arizona

   Licensed under the Apache License, Version 2.0 (the "License" );
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

#include <stdio.h>
#include <sys/types.h>
#include <utime.h>
#include <sys/stat.h>
#include <sys/statvfs.h>

// entry point
int main( int argc, char** argv ) {
    printf("primitive types\n");
    printf("int: %lu\n", sizeof(int));
    printf("long: %lu\n", sizeof(long));
    printf("\n");

    printf("linux datatypes\n");
    printf("off_t: %lu\n", sizeof(off_t));
    printf("size_t: %lu\n", sizeof(size_t));
    printf("mode_t: %lu\n", sizeof(mode_t));
    printf("dev_t: %lu\n", sizeof(dev_t));
    printf("ino_t: %lu\n", sizeof(ino_t));
    printf("nlink_t: %lu\n", sizeof(nlink_t));
    printf("uid_t: %lu\n", sizeof(uid_t));
    printf("gid_t: %lu\n", sizeof(gid_t));
    printf("time_t: %lu\n", sizeof(time_t));
    printf("blksize_t: %lu\n", sizeof(blksize_t));
    printf("blkcnt_t: %lu\n", sizeof(blkcnt_t));
    printf("fsblkcnt_t: %lu\n", sizeof(fsblkcnt_t));
    printf("fsfilcnt_t: %lu\n", sizeof(fsfilcnt_t));
    printf("\n");

    printf("complex types:\n");
    printf("utimbuf: %lu\n", sizeof(struct utimbuf));
    printf("statvfs: %lu\n", sizeof(struct statvfs));
    return 0;
}
