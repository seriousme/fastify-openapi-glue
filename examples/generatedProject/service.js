// implementation of the operations in the openapi specification

export class Service {
  constructor() {}



  // Operation: addPet
  // URL: /pet
  // summary:  Add a new pet to the store
  // req.body
  //   type: object
  //   required:
  //     - name
  //     - photoUrls
  //   properties:
  //     id:
  //       type: integer
  //       format: int64
  //     category:
  //       type: object
  //       properties:
  //         id:
  //           type: integer
  //           format: int64
  //         name:
  //           type: string
  //       xml:
  //         name: Category
  //     name:
  //       type: string
  //       example: doggie
  //     photoUrls:
  //       type: array
  //       xml:
  //         name: photoUrl
  //         wrapped: true
  //       items:
  //         type: string
  //     tags:
  //       type: array
  //       xml:
  //         name: tag
  //         wrapped: true
  //       items:
  //         type: object
  //         properties:
  //           id:
  //             type: integer
  //             format: int64
  //           name:
  //             type: string
  //         xml:
  //           name: Tag
  //     status:
  //       type: string
  //       description: pet status in the store
  //       enum:
  //         - available
  //         - pending
  //         - sold
  //   xml:
  //     name: Pet
  //
  // valid responses
  //   '405':
  //     description: Invalid input
  //

  async addPet(req, reply) {
    console.log("addPet", req.params);
    return { key: "value" };
  }


  // Operation: updatePet
  // URL: /pet
  // summary:  Update an existing pet
  // req.body
  //   type: object
  //   required:
  //     - name
  //     - photoUrls
  //   properties:
  //     id:
  //       type: integer
  //       format: int64
  //     category:
  //       type: object
  //       properties:
  //         id:
  //           type: integer
  //           format: int64
  //         name:
  //           type: string
  //       xml:
  //         name: Category
  //     name:
  //       type: string
  //       example: doggie
  //     photoUrls:
  //       type: array
  //       xml:
  //         name: photoUrl
  //         wrapped: true
  //       items:
  //         type: string
  //     tags:
  //       type: array
  //       xml:
  //         name: tag
  //         wrapped: true
  //       items:
  //         type: object
  //         properties:
  //           id:
  //             type: integer
  //             format: int64
  //           name:
  //             type: string
  //         xml:
  //           name: Tag
  //     status:
  //       type: string
  //       description: pet status in the store
  //       enum:
  //         - available
  //         - pending
  //         - sold
  //   xml:
  //     name: Pet
  //
  // valid responses
  //   '400':
  //     description: Invalid ID supplied
  //   '404':
  //     description: Pet not found
  //   '405':
  //     description: Validation exception
  //

  async updatePet(req, reply) {
    console.log("updatePet", req.params);
    return { key: "value" };
  }


  // Operation: findPetsByStatus
  // URL: /pet/findByStatus
  // summary:  Finds Pets by status
  // req.query
  //   type: object
  //   properties:
  //     status:
  //       description: Status values that need to be considered for filter
  //       type: array
  //   required:
  //     - status
  //
  // valid responses
  //   '200':
  //     description: successful operation
  //     schema:
  //       type: array
  //       items:
  //         type: object
  //         required:
  //           - name
  //           - photoUrls
  //         properties:
  //           id:
  //             type: integer
  //             format: int64
  //           category:
  //             type: object
  //             properties:
  //               id:
  //                 type: integer
  //                 format: int64
  //               name:
  //                 type: string
  //             xml:
  //               name: Category
  //           name:
  //             type: string
  //             example: doggie
  //           photoUrls:
  //             type: array
  //             xml:
  //               name: photoUrl
  //               wrapped: true
  //             items:
  //               type: string
  //           tags:
  //             type: array
  //             xml:
  //               name: tag
  //               wrapped: true
  //             items:
  //               type: object
  //               properties:
  //                 id:
  //                   type: integer
  //                   format: int64
  //                 name:
  //                   type: string
  //               xml:
  //                 name: Tag
  //           status:
  //             type: string
  //             description: pet status in the store
  //             enum:
  //               - available
  //               - pending
  //               - sold
  //         xml:
  //           name: Pet
  //   '400':
  //     description: Invalid status value
  //

  async findPetsByStatus(req, reply) {
    console.log("findPetsByStatus", req.params);
    return { key: "value" };
  }


  // Operation: findPetsByTags
  // URL: /pet/findByTags
  // summary:  Finds Pets by tags
  // req.query
  //   type: object
  //   properties:
  //     tags:
  //       description: Tags to filter by
  //       type: array
  //   required:
  //     - tags
  //
  // valid responses
  //   '200':
  //     description: successful operation
  //     schema:
  //       type: array
  //       items:
  //         type: object
  //         required:
  //           - name
  //           - photoUrls
  //         properties:
  //           id:
  //             type: integer
  //             format: int64
  //           category:
  //             type: object
  //             properties:
  //               id:
  //                 type: integer
  //                 format: int64
  //               name:
  //                 type: string
  //             xml:
  //               name: Category
  //           name:
  //             type: string
  //             example: doggie
  //           photoUrls:
  //             type: array
  //             xml:
  //               name: photoUrl
  //               wrapped: true
  //             items:
  //               type: string
  //           tags:
  //             type: array
  //             xml:
  //               name: tag
  //               wrapped: true
  //             items:
  //               type: object
  //               properties:
  //                 id:
  //                   type: integer
  //                   format: int64
  //                 name:
  //                   type: string
  //               xml:
  //                 name: Tag
  //           status:
  //             type: string
  //             description: pet status in the store
  //             enum:
  //               - available
  //               - pending
  //               - sold
  //         xml:
  //           name: Pet
  //   '400':
  //     description: Invalid tag value
  //

  async findPetsByTags(req, reply) {
    console.log("findPetsByTags", req.params);
    return { key: "value" };
  }


  // Operation: getPetById
  // URL: /pet/:petId
  // summary:  Find pet by ID
  // req.params
  //   type: object
  //   properties:
  //     petId:
  //       description: ID of pet to return
  //       type: integer
  //   required:
  //     - petId
  //
  // valid responses
  //   '200':
  //     description: successful operation
  //     schema:
  //       type: object
  //       required:
  //         - name
  //         - photoUrls
  //       properties:
  //         id:
  //           type: integer
  //           format: int64
  //         category:
  //           type: object
  //           properties:
  //             id:
  //               type: integer
  //               format: int64
  //             name:
  //               type: string
  //           xml:
  //             name: Category
  //         name:
  //           type: string
  //           example: doggie
  //         photoUrls:
  //           type: array
  //           xml:
  //             name: photoUrl
  //             wrapped: true
  //           items:
  //             type: string
  //         tags:
  //           type: array
  //           xml:
  //             name: tag
  //             wrapped: true
  //           items:
  //             type: object
  //             properties:
  //               id:
  //                 type: integer
  //                 format: int64
  //               name:
  //                 type: string
  //             xml:
  //               name: Tag
  //         status:
  //           type: string
  //           description: pet status in the store
  //           enum:
  //             - available
  //             - pending
  //             - sold
  //       xml:
  //         name: Pet
  //   '400':
  //     description: Invalid ID supplied
  //   '404':
  //     description: Pet not found
  //

  async getPetById(req, reply) {
    console.log("getPetById", req.params);
    return { key: "value" };
  }


  // Operation: updatePetWithForm
  // URL: /pet/:petId
  // summary:  Updates a pet in the store with form data
  // req.params
  //   type: object
  //   properties:
  //     petId:
  //       description: ID of pet that needs to be updated
  //       type: integer
  //   required:
  //     - petId
  //
  // req.body
  //   type: object
  //   properties:
  //     name:
  //       description: Updated name of the pet
  //       type: string
  //     status:
  //       description: Updated status of the pet
  //       type: string
  //
  // valid responses
  //   '405':
  //     description: Invalid input
  //

  async updatePetWithForm(req, reply) {
    console.log("updatePetWithForm", req.params);
    return { key: "value" };
  }


  // Operation: deletePet
  // URL: /pet/:petId
  // summary:  Deletes a pet
  // req.headers
  //   type: object
  //   properties:
  //     api_key:
  //       type: string
  //
  // req.params
  //   type: object
  //   properties:
  //     petId:
  //       description: Pet id to delete
  //       type: integer
  //   required:
  //     - petId
  //
  // valid responses
  //   '400':
  //     description: Invalid ID supplied
  //   '404':
  //     description: Pet not found
  //

  async deletePet(req, reply) {
    console.log("deletePet", req.params);
    return { key: "value" };
  }


  // Operation: uploadFile
  // URL: /pet/:petId/uploadImage
  // summary:  uploads an image
  // req.params
  //   type: object
  //   properties:
  //     petId:
  //       description: ID of pet to update
  //       type: integer
  //   required:
  //     - petId
  //
  // req.body
  //   type: object
  //   properties:
  //     additionalMetadata:
  //       description: Additional data to pass to server
  //       type: string
  //     file:
  //       description: file to upload
  //       type: string
  //
  // valid responses
  //   '200':
  //     description: successful operation
  //     schema:
  //       type: object
  //       properties:
  //         code:
  //           type: integer
  //           format: int32
  //         type:
  //           type: string
  //         message:
  //           type: string
  //

  async uploadFile(req, reply) {
    console.log("uploadFile", req.params);
    return { key: "value" };
  }


  // Operation: getInventory
  // URL: /store/inventory
  // summary:  Returns pet inventories by status
  // valid responses
  //   '200':
  //     description: successful operation
  //     schema:
  //       type: object
  //       additionalProperties:
  //         type: integer
  //         format: int32
  //

  async getInventory(req, reply) {
    console.log("getInventory", req.params);
    return { key: "value" };
  }


  // Operation: placeOrder
  // URL: /store/order
  // summary:  Place an order for a pet
  // req.body
  //   type: object
  //   properties:
  //     id:
  //       type: integer
  //       format: int64
  //     petId:
  //       type: integer
  //       format: int64
  //     quantity:
  //       type: integer
  //       format: int32
  //     shipDate:
  //       type: string
  //       format: date-time
  //     status:
  //       type: string
  //       description: Order Status
  //       enum:
  //         - placed
  //         - approved
  //         - delivered
  //     complete:
  //       type: boolean
  //       default: false
  //   xml:
  //     name: Order
  //
  // valid responses
  //   '200':
  //     description: successful operation
  //     schema:
  //       type: object
  //       properties:
  //         id:
  //           type: integer
  //           format: int64
  //         petId:
  //           type: integer
  //           format: int64
  //         quantity:
  //           type: integer
  //           format: int32
  //         shipDate:
  //           type: string
  //           format: date-time
  //         status:
  //           type: string
  //           description: Order Status
  //           enum:
  //             - placed
  //             - approved
  //             - delivered
  //         complete:
  //           type: boolean
  //           default: false
  //       xml:
  //         name: Order
  //   '400':
  //     description: Invalid Order
  //

  async placeOrder(req, reply) {
    console.log("placeOrder", req.params);
    return { key: "value" };
  }


  // Operation: getOrderById
  // URL: /store/order/:orderId
  // summary:  Find purchase order by ID
  // req.params
  //   type: object
  //   properties:
  //     orderId:
  //       description: ID of pet that needs to be fetched
  //       type: integer
  //   required:
  //     - orderId
  //
  // valid responses
  //   '200':
  //     description: successful operation
  //     schema:
  //       type: object
  //       properties:
  //         id:
  //           type: integer
  //           format: int64
  //         petId:
  //           type: integer
  //           format: int64
  //         quantity:
  //           type: integer
  //           format: int32
  //         shipDate:
  //           type: string
  //           format: date-time
  //         status:
  //           type: string
  //           description: Order Status
  //           enum:
  //             - placed
  //             - approved
  //             - delivered
  //         complete:
  //           type: boolean
  //           default: false
  //       xml:
  //         name: Order
  //   '400':
  //     description: Invalid ID supplied
  //   '404':
  //     description: Order not found
  //

  async getOrderById(req, reply) {
    console.log("getOrderById", req.params);
    return { key: "value" };
  }


  // Operation: deleteOrder
  // URL: /store/order/:orderId
  // summary:  Delete purchase order by ID
  // req.params
  //   type: object
  //   properties:
  //     orderId:
  //       description: ID of the order that needs to be deleted
  //       type: integer
  //   required:
  //     - orderId
  //
  // valid responses
  //   '400':
  //     description: Invalid ID supplied
  //   '404':
  //     description: Order not found
  //

  async deleteOrder(req, reply) {
    console.log("deleteOrder", req.params);
    return { key: "value" };
  }


  // Operation: createUser
  // URL: /user
  // summary:  Create user
  // req.body
  //   type: object
  //   properties:
  //     id:
  //       type: integer
  //       format: int64
  //     username:
  //       type: string
  //     firstName:
  //       type: string
  //     lastName:
  //       type: string
  //     email:
  //       type: string
  //     password:
  //       type: string
  //     phone:
  //       type: string
  //     userStatus:
  //       type: integer
  //       format: int32
  //       description: User Status
  //   xml:
  //     name: User
  //
  // valid responses
  //   default:
  //     description: successful operation
  //

  async createUser(req, reply) {
    console.log("createUser", req.params);
    return { key: "value" };
  }


  // Operation: createUsersWithArrayInput
  // URL: /user/createWithArray
  // summary:  Creates list of users with given input array
  // req.body
  //   type: array
  //   items:
  //     type: object
  //     properties:
  //       id:
  //         type: integer
  //         format: int64
  //       username:
  //         type: string
  //       firstName:
  //         type: string
  //       lastName:
  //         type: string
  //       email:
  //         type: string
  //       password:
  //         type: string
  //       phone:
  //         type: string
  //       userStatus:
  //         type: integer
  //         format: int32
  //         description: User Status
  //     xml:
  //       name: User
  //
  // valid responses
  //   default:
  //     description: successful operation
  //

  async createUsersWithArrayInput(req, reply) {
    console.log("createUsersWithArrayInput", req.params);
    return { key: "value" };
  }


  // Operation: createUsersWithListInput
  // URL: /user/createWithList
  // summary:  Creates list of users with given input array
  // req.body
  //   type: array
  //   items:
  //     type: object
  //     properties:
  //       id:
  //         type: integer
  //         format: int64
  //       username:
  //         type: string
  //       firstName:
  //         type: string
  //       lastName:
  //         type: string
  //       email:
  //         type: string
  //       password:
  //         type: string
  //       phone:
  //         type: string
  //       userStatus:
  //         type: integer
  //         format: int32
  //         description: User Status
  //     xml:
  //       name: User
  //
  // valid responses
  //   default:
  //     description: successful operation
  //

  async createUsersWithListInput(req, reply) {
    console.log("createUsersWithListInput", req.params);
    return { key: "value" };
  }


  // Operation: loginUser
  // URL: /user/login
  // summary:  Logs user into the system
  // req.query
  //   type: object
  //   properties:
  //     username:
  //       description: The user name for login
  //       type: string
  //     password:
  //       description: The password for login in clear text
  //       type: string
  //   required:
  //     - username
  //     - password
  //
  // valid responses
  //   '200':
  //     description: successful operation
  //     schema:
  //       type: string
  //     headers:
  //       X-Rate-Limit:
  //         type: integer
  //         format: int32
  //         description: calls per hour allowed by the user
  //       X-Expires-After:
  //         type: string
  //         format: date-time
  //         description: date in UTC when token expires
  //   '400':
  //     description: Invalid username/password supplied
  //

  async loginUser(req, reply) {
    console.log("loginUser", req.params);
    return { key: "value" };
  }


  // Operation: logoutUser
  // URL: /user/logout
  // summary:  Logs out current logged in user session
  // valid responses
  //   default:
  //     description: successful operation
  //

  async logoutUser(req, reply) {
    console.log("logoutUser", req.params);
    return { key: "value" };
  }


  // Operation: getUserByName
  // URL: /user/:username
  // summary:  Get user by user name
  // req.params
  //   type: object
  //   properties:
  //     username:
  //       description: 'The name that needs to be fetched. Use user1 for testing. '
  //       type: string
  //   required:
  //     - username
  //
  // valid responses
  //   '200':
  //     description: successful operation
  //     schema:
  //       type: object
  //       properties:
  //         id:
  //           type: integer
  //           format: int64
  //         username:
  //           type: string
  //         firstName:
  //           type: string
  //         lastName:
  //           type: string
  //         email:
  //           type: string
  //         password:
  //           type: string
  //         phone:
  //           type: string
  //         userStatus:
  //           type: integer
  //           format: int32
  //           description: User Status
  //       xml:
  //         name: User
  //   '400':
  //     description: Invalid username supplied
  //   '404':
  //     description: User not found
  //

  async getUserByName(req, reply) {
    console.log("getUserByName", req.params);
    return { key: "value" };
  }


  // Operation: updateUser
  // URL: /user/:username
  // summary:  Updated user
  // req.params
  //   type: object
  //   properties:
  //     username:
  //       description: name that need to be updated
  //       type: string
  //   required:
  //     - username
  //
  // req.body
  //   type: object
  //   properties:
  //     id:
  //       type: integer
  //       format: int64
  //     username:
  //       type: string
  //     firstName:
  //       type: string
  //     lastName:
  //       type: string
  //     email:
  //       type: string
  //     password:
  //       type: string
  //     phone:
  //       type: string
  //     userStatus:
  //       type: integer
  //       format: int32
  //       description: User Status
  //   xml:
  //     name: User
  //
  // valid responses
  //   '400':
  //     description: Invalid user supplied
  //   '404':
  //     description: User not found
  //

  async updateUser(req, reply) {
    console.log("updateUser", req.params);
    return { key: "value" };
  }


  // Operation: deleteUser
  // URL: /user/:username
  // summary:  Delete user
  // req.params
  //   type: object
  //   properties:
  //     username:
  //       description: The name that needs to be deleted
  //       type: string
  //   required:
  //     - username
  //
  // valid responses
  //   '400':
  //     description: Invalid username supplied
  //   '404':
  //     description: User not found
  //

  async deleteUser(req, reply) {
    console.log("deleteUser", req.params);
    return { key: "value" };
  }
}
