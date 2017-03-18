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
    
    console.log("syndicate-mkdir.js");
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
            var rc = 0;
            var um = ~process.umask() & parseInt("0777", 8);

            // try to mkdir
            rc = UG_mkdir( ug, path, um );
            if( rc !== 0 ) {
                console.error("Failed to mkdir '" + path + "': " + posixerr.strerror(-rc));
                libsyndicate_ug.UG_shutdown( ug );
                return;
            }
        }

        libsyndicate_ug.UG_shutdown( ug );
    } catch (e) {
        console.error("Exception occured : " + e);
    }
})();
