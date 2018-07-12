

export default async function main(pathString) {
  let nameList = [];
  for (let name in this.data){
    nameList.push(name);
  }
  nameList.sort();
  return nameList.join('\n');
}
