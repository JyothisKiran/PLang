export class Environment {
  private values: Map<string, any> = new Map();

  declare(name: string, value: any) {
    this.values.set(name, value);
  }

  get(name: string) {
    if (!this.values.has(name)) {
      throw new Error(`Undefined variable: ${name}`);
    }
    return this.values.get(name);
  }
}