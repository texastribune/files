

let monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

export default async function main(type) {
  let origPath = this.path.slice();
  let count = 0;

  // Create a map of month names to an array of file data created that month
  let monthData = {};
  for (let fileName in this.data) {
    let fileData = this.data[fileName];
    if (!fileData.directory) {
      let month = new Date(fileData.created).getMonth();
      let monthName = monthNames[month];
      let fileList = monthData[monthName] || [];
      fileList.push(fileData);
      monthData[monthName] = fileList;
    }
  }

  for (let monthName in monthData) {
    if (!this.data.hasOwnProperty(monthName)){
      await this.addDirectory(this.path, true, monthName);
    }

    await this.changeDirectory([monthName]);

    let fileList = monthData[monthName];
    for (let file of fileList) {
      count++;
      await this.move(file.id);
    }

    await this.changeDirectory(origPath, true);
  }

  return `${count} files archived`;
}
