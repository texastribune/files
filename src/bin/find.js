

export default async function main(query) {
  let results = await this.search(query);
  let nameList = [];
  for (let obj of results){
    nameList.push(obj.name);
  }
  return nameList.join('\n');
}
