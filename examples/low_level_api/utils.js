/*
   Copyright 2015 The Trustees of Princeton University

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

var libsyndicate_node = require('../../libsyndicate-node.js');
var libsyndicate = libsyndicate_node.libsyndicate;
var libsyndicate_ug = libsyndicate_node.libsyndicate_ug;

var ref = require('ref');
var ffi = require('ffi');
var Struct = require('ref-struct');
var ArrayType = require('ref-array');

/**
 * Expose root class
 */
module.exports = {
    // usage
    usage: function(progname, args) {
        console.log("Usage: " + progname + " [syndicate arguments] " + args);
        return 0;
    },
    // print a single entry 
    print_entry: function(dirent) {
        var entry_data = ref.alloc("string");
        var rc = 0;

        rc = libsyndicate.md_entry_to_string( dirent, entry_data );
        if( rc !== 0 ) {
            return rc;
        }

        console.log(entry_data.deref());
        //TODO: free
        //free( entry_data );
        return 0;
    },
    print_debug: function(message) {
        console.log(message);
    }
};
