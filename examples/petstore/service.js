// an example of implementation of the operations in the openapi specification

export class Service {
  constructor() {}

  async getPetById(req, resp) {
    console.log("getPetById", req.params.petId);
    if (req.params.petId === 0) {
      // missing required data on purpose !
      // this will trigger a server error on serialization
      return { pet: "Doggie the dog" };
    } else {
      return {
        id: req.params.petId,
        name: "Kitty the cat",
        photoUrls: [
            "https://en.wikipedia.org/wiki/Cat#/media/File:Kittyply_edit1.jpg"
        ],
        status: "available"
      };
    }
  }
}

