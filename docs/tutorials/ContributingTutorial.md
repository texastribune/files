
### Tests

This project uses jest to run automated tests. The tests reside any directory named \_\_test\_\_
 within the /src directory. To run tests, run ```npm run test```.

### Making documentation

This project uses JSDoc to create automated documentation. Classes, functions, etc. that make up the
public api of this project should use JSDoc compatible comments in the code
(http://usejsdoc.org/about-getting-started.html#adding-documentation-comments-to-your-code).

Static assets can be placed in the /docs/assets directory and referenced like so ```<img src="assets/foo.png">```.
  Tutorials can be placed in the tutorials folder as markdown files. 

To build the documentation, run ```npm run docs```. If all goes well, the latest documentation should
built and output to the /docs folder.

