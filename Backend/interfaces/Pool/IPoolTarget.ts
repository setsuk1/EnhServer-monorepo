export interface IPoolTarget<T> {
    new(...args: any[]): T;
}