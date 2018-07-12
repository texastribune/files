

export default async function main(pathString) {
  let pathArray = pathString.split('/');
  if (pathArray[0] !== ''){
    pathArray = this.path.concat(pathArray);
  }
  await this.changeDirectory(pathArray);
}
