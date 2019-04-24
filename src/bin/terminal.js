import {TerminalDialog} from "../ui/terminal";


export default async function main() {
  let terminal = new TerminalDialog(this);
  terminal.element.id = 'TR' + Math.random().toString(36).split('.')[1];
  terminal.show();
  return `New terminal created with id=${terminal.element.id}`;
}
