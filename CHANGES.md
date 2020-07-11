# Changelog

## [current release]
### Changed

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