# Changelog

## [Unreleased]
### Changed

## [2.5.1] - 12-05-2021
### Changed
 - Fix: formats ajv error to include property names (kutyepov)

## [2.5.0] - 29-04-2021
### Changed
 - Added support for objects in querystring 

## [2.4.1] - 23-04-2021
### Changed
 - Removed dependency on decimal.js-light
 - Fixed bug in validation of 'Byte' format
 - Updated dependencies:
    - ajv           ^7.0.3  →   ^8.0.1     
    - ajv-formats   ^1.5.1  →   ^2.0.2   
    - fastify      ^3.10.1  →  ^3.15.0    
    - fastify-cli   ^2.7.0  →   ^2.9.1  
    - js-yaml       ^4.0.0  →   ^4.1.0     
    - tap          ^14.11.0  →  ^15.0.4    

## [2.4.0] - 24-01-2021
### Changed
 - Removed dependency on ajv-oai
 - Removed workaround for hasContentTypeParser
 - Added AJV formats for 'binary' and 'password' to reduce warnings
 - Updated dependencies:
    - ajv          ^6.12.6  →  ^7.0.3  
    - js-yaml       ^3.14.1  →   ^4.0.0
    - fastify  ^3.9.2  →  ^3.10.1 

## [2.3.1] - 30-12-2020
### Changed 
 - Updated dependencies:
    - js-yaml       ^3.14.0  →   ^3.14.1     
    - fastify        ^3.8.0  →    ^3.9.2     
    - fastify-cli    ^2.5.1  →    ^2.7.0     
    - tap          ^14.10.8  →  ^14.11.0    

## [2.3.0] - 10-10-2020
### Changed 
 - Added ES6 module support for service.js and security.js
 - Updated dependencies:
    - fastify       ^3.7.0  →   ^3.8.0  

## [2.2.2] - 24-10-2020
### Changed 
 - Added types property to package.json
 - Updated dependencies:
    - ajv          ^6.12.5  →  ^6.12.6   
    - ajv-oai       ^1.2.0  →   ^1.2.1   
    - fastify       ^3.4.1  →   ^3.7.0   
    - fastify-cli   ^2.2.0  →   ^2.5.1   

## [2.2.1] - 20-09-2020
### Changed 
 - Fixed missing slash in generator template
 - Updated dependencies:
    - ajv             ^6.12.4  →  ^6.12.5   
    - fastify-plugin   ^2.3.1  →   ^2.3.4   
    - swagger-parser  ^10.0.1  →  ^10.0.2   
    - fastify          ^3.2.1  →   ^3.4.1  

## [2.2.0] - 20-08-2020
### Changed 
 - Added "x-" properties to the fastify reply context
 - Updated dependencies:
  - ajv             ^6.12.3  →  ^6.12.4 
  - fastify-plugin   ^2.3.0  →   ^2.3.1 
  - fastify          ^3.2.0  →   ^3.2.1 
  - fastify-cli      ^2.1.0  →   ^2.2.0 

## [2.1.0] - 14-08-2020
### Changed 
 - Enable passthrough of security handler errors (mhamann)
 - Added parameters and initializer to securityHandlers (see docs/securityHandlers.md)
 - Refactored index.js and parsers
 - Updated examples to v3
 - Added tests
 - Updated dependencies:
    - fastify-plugin    ^2.0.0  →    ^2.3.0 
    - swagger-parser   ^10.0.0  →   ^10.0.1 
    - fastify           ^3.0.0  →    ^3.2.0 
    - fastify-cli       ^2.0.2  →    ^2.1.0 
    - tap             ^14.10.7  →  ^14.10.8 

## [2.0.5] - 06-08-2020
### Changed 
 - Warnings for missing content handlers now go to the fastify log
 - Bump fastify-plugin from 2.0.2 to 2.1.1

## [2.0.4] - 28-07-2020
### Changed 
 - Fix stripResponseFormats for recursive schemas (lundibundi)
 - Bump fastify-plugin from 2.0.1 to 2.0.2
 - Bump tap from 14.10.7 to 14.10.8

## [2.0.3] - 20-07-2020
### Changed
 - Bump fastify from 3.0.3 to 3.1.1
 - Bump swagger-parser from 10.0.0 to 10.0.
 - Fixed typescript definitions (zekth)
 
## [2.0.2] - 16-07-2020
### Changed 
 - Just a version bump to fix operator error

## [2.0.1] - 16-07-2020
### Changed 
 - Bump fastify from 3.0.0 to 3.0.3
 - Bump swagger-parser from 9.0.1 to 10.0.
 - Bump fastify-plugin from 2.0.0 to 2.0.1
 - [Security] Bump lodash from 4.17.15 to 4.17.19

## [2.0.0] 11-07-2020
### Changed
 - Migrated to fastify 3.0.0, major version as the change is not compatible with fastify 2.x.y.

## [1.7.1] 09-07-2020
### Changed
  - Made securityHandlers parameter optional in Typescript signature

## [1.7.0] 08-07-2020
### Changed
  - Added securityHandlers parameter (mhamann)
  - Updated dependencies
    - ajv      ^6.12.2  →  ^6.12.3 
    - js-yaml  ^3.13.1  →  ^3.14.0 
    - fastify  ^2.13.1  →  ^2.15.1

## [1.6.0] 17-06-2020
### Changed
  - Added ajvOptions parameter (justinsc )

## [1.5.2] 23-04-2020
### Changed
  - Added Typescript definitions (Xaver Schulz)
  - Fixed loss of 'this' in service.js (Xaver Schulz)
  - Updated dependencies
    - ajv              ^6.12.0  →   ^6.12.2
    - fastify          ^2.13.0  →   ^2.13.1
## [1.5.1] 06-04-2020
### Changed
 - Updated dependencies
   - ajv              ^6.11.0  →   ^6.12.0 
   - fastify-plugin    ^1.6.0  →    ^1.6.1 
   - minimist          ^1.2.0  →    ^1.2.5 
   - swagger-parser    ^9.0.0  →    ^9.0.1 
    - fastify          ^2.11.0  →   ^2.13.0 
   - fastify-cli       ^1.3.0  →    ^1.5.0 
    - tap             ^14.10.6  →  ^14.10.7 

## [1.5.0] 31-01-2020
### Changed
 - Added noAdditional option

## [1.4.0] 21-01-2020
### Changed
 - Added nullable flag to ajv config
 - Updated dependencies
   - ajv              ^6.10.2  →   ^6.11.0 
   - ajv-oai           ^1.1.5  →    ^1.2.0 
   - swagger-parser    ^8.0.3  →    ^8.0.4 
   - fastify          ^2.10.0  →   ^2.11.0 
   - tap             ^14.10.2  →  ^14.10.6 

## [1.3.1] 29-11-2019
### Changed
 - Fixed bug in Petshop example
 - Updated dependencies:
   - swagger-parser   ^8.0.2  →   ^8.0.3
   - ajv-oai          ^1.1.1  →   ^1.1.5
   - tap             ^14.7.1  →  ^14.10.2

## [1.3.0] 16-10-2019
### Changed
 - Enabled async service creation
 - Updated dependencies:
   - swagger-parser   ^8.0.0  →   ^8.0.2
   - fastify          ^2.6.0  →  ^2.10.0
   - fastify-cli      ^1.1.0  →   ^1.3.0
   - tap             ^14.4.2  →  ^14.7.1
## [v1.2.0] 19-07-2019
### Changed
 - enabled generic parameters on path items
 - Added notes section to README.md to explain plugin behaviour better
 - Updated dependencies:
   - swagger-parser  ^7.0.1  →   ^8.0.0
   - fastify-plugin   ^1.5.0  →   ^1.6.0
   - fastify          ^2.2.0  →   ^2.6.0
   - fastify-cli      ^1.0.0  →   ^1.1.0
   - tap             ^14.0.0  →  ^14.4.2
## [v1.1.0] 14-06-2019
### Added 
 - `prefix` option, see README.md
 - CHANGES.md
## [v1.0.6]
### Changed
 - Updated dependencies
## [v1.0.5]
### Changed
- Updated dependencies
## [v1.0.4] 30-11-2018
### Changed
- Fixed handling of no parameters on V2
## [v1.0.3]
### Changed
- Updated dependencies
## [v1.0.1]
### Changed
- Updated dependencies
## [v1.0.0] 30-06-2018
Initial version
