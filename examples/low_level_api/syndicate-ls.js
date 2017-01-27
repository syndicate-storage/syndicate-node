#!/bin/env node
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

var ref = require('ref');
var ffi = require('ffi');
var libsyndicate_node = require('../../libsyndicate-node.js');
var libsyndicate = libsyndicate_node.libsyndicate;
var libsyndicate_ug = libsyndicate_node.libsyndicate_ug;

var utils = require('./utils.js');
var posixerr = require('../../posix_errors.js');

(function main() {
    var args = process.argv.slice(1);
    
    console.log("syndicate-ls.js");
    try {
        // init UG
        var ug = libsyndicate_ug.UG_init(args.length, args);
        if( ug.isNull() ) {
            console.error("UG_init failed");
            return;
        }

        var gateway = libsyndicate_ug.UG_state_gateway( ug );
        // get the directory path 
        var path_optind = libsyndicate.SG_gateway_first_arg_optind( gateway );
        if( path_optind === args.length ) {
            console.error("SG_gateway_first_arg_optind failed");
            utils.usage( args[0], "dir [dir...]" );
            //md_common_usage();
            libsyndicate_ug.UG_shutdown( ug );
            return;
        }

        var i;
        for(i=path_optind;i<args.length;i++) {
            var path = args[i];
            var dirent = libsyndicate_node.create_md_entry();
            // load up...
            var rc = libsyndicate_ug.UG_stat_raw( ug, path, dirent.ref() );
            if( rc !== 0 ) {
                console.error("Failed to stat '" + path + "': " + posixerr.strerror(-rc));
                libsyndicate_ug.UG_shutdown( ug );
                continue;
            }

            if( dirent.type === libsyndicate_node.MD_ENTRY_FILE ) {
                // regular file
                utils.print_entry( dirent.ref() );
            } else {
                // directory 
                var rc2 = libsyndicate_node.create_integer();
                var dirh = libsyndicate_ug.UG_opendir( ug, path, rc2 );
                if( dirh.isNull() ) {
                    console.error("Failed to open directory '" + path + "': " + posixerr.strerror(-rc2.deref()));
                    libsyndicate_ug.UG_shutdown( ug );
                    return;
                }

                while( true ) {
                    var dirents = libsyndicate_node.create_md_entry_ptr_ptr();
                    rc = libsyndicate_ug.UG_readdir( ug, dirents, 1, dirh );
                    if( rc !== 0 ) {
                        console.error("Failed to read directory '" + path + "': " + posixerr.strerror(-rc));
                        rc = libsyndicate_ug.UG_closedir( ug, dirh );
                        if( rc !== 0 ) {
                            console.error("Failed to close directory '" + path + "': " + posixerr.strerror(-rc));
                        }

                        libsyndicate_ug.UG_shutdown( ug );
                        return;
                    }
                    
                    var dirents_d = dirents.deref();
                    if( !dirents_d.isNull() ) {
                        var dirents_d = dirents.deref();
                        var entry = ref.get(dirents_d, 0, ref.types.pointer);
                        if( entry.isNull() ) {
                            // EOF 
                            libsyndicate_ug.UG_free_dir_listing( dirents_d );
                            break;
                        }

                        var j = 0;
                        while( !entry.isNull() ) {
                            utils.print_entry( entry );
                            j++;
                            entry = ref.get(dirents_d, ref.sizeof.pointer * j, ref.types.pointer);
                        }
                        
                        libsyndicate_ug.UG_free_dir_listing( dirents_d );
                    } else {
                        // no data
                        break;
                    }
                }
                
                rc = libsyndicate_ug.UG_closedir( ug, dirh );
                if( rc !== 0 ) {
                    console.error("Failed to close directory '" + path + "': " + posixerr.strerror(-rc));
                    
                    libsyndicate_ug.UG_shutdown( ug );
                    return;
                }
            }
        }

        // shutdown UG
        libsyndicate_ug.UG_shutdown( ug );
    } catch (e) {
        console.error("Exception occured : " + e);
    }
})();
