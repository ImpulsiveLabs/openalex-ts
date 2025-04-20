class LogicalExpression {
    protected token: string;
    public value: unknown;

    constructor(value: unknown, token: string) {
        this.value = value;
        this.token = token;
    }

    public toString(): string {
        return `${this.token}${this.value}`;
    }
}

class Or extends LogicalExpression {
    constructor(value: unknown) {
        super(value, '');
    }

    public toString(): string {
        if (Array.isArray(this.value)) {
            return this.value.map((v: unknown) => String(v)).join('|');
        }
        return String(this.value);
    }
}

class Not extends LogicalExpression {
    constructor(value: unknown) {
        super(value, '!');
    }
}

class Gt extends LogicalExpression {
    constructor(value: unknown) {
        super(value, '>');
    }
}

class Lt extends LogicalExpression {
    constructor(value: unknown) {
        super(value, '<');
    }
}

const or_ = (value: unknown) => new Or(value);
const not_ = (value: unknown) => new Not(value);
const gt_ = (value: unknown) => new Gt(value);
const lt_ = (value: unknown) => new Lt(value);

export { or_, not_, gt_, lt_, LogicalExpression, Or, Not, Gt, Lt };