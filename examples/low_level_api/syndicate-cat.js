#!/usr/bin/env node
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
    
    console.log("syndicate-cat.js");
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
            utils.usage( args[0], "file [file...]" );
            //md_common_usage();
            libsyndicate_ug.UG_shutdown( ug );
            return;
        }

        // make a read buffer (1 MB chunks should be fine) 
        var buf = new Buffer(1024 * 1024);
        if( buf.isNull() ) {
            console.error("Out of memory");
            libsyndicate_ug.UG_shutdown( ug );
            return;
        }
        buf.type = ref.types.CString;

        var i;
        for(i=path_optind;i<args.length;i++) {
            var path = args[i];
            var rc = 0;

            // try to open...
            var rc2 = libsyndicate_node.create_integer();
            var fh = libsyndicate_ug.UG_open( ug, path, libsyndicate_node.O_RDONLY, rc2 );
            if( rc2.deref() !== 0 ) {
                console.error("Failed to open '" + path + "': " + posixerr.strerror(-rc2.deref()));
                libsyndicate_ug.UG_shutdown( ug );
                return;
            }

            // try to read 
            var nr = 0;
            while( 1 ) {
                nr = libsyndicate_ug.UG_read( ug, buf, 1024 * 1024, fh );
                if( nr < 0 ) {
                    console.error(path + ": read: " + posixerr.strerror(-nr));
                    rc = nr;
                    break;
                }
                if( nr === 0 ) {
                    // EOF
                    utils.print_debug("EOF on " + path);
                    rc = 0;
                    break;
                }

                utils.print_debug("Read " + nr + " bytes");
                process.stdout.write(buf.slice(0, nr));
            }

            // close up 
            var close_rc = libsyndicate_ug.UG_close( ug, fh );
            if( close_rc < 0 ) {
                console.error(path + ": close: " + posixerr.strerror(-close_rc));
                libsyndicate_ug.UG_shutdown( ug );
                return;
            }

            if( rc !== 0 ) {
                break;
            }
        }

        libsyndicate_ug.UG_shutdown( ug );
    } catch (e) {
        console.error("Exception occured : " + e);
    }
})();
