
// A custom error type for Firestore permission errors.
// This allows us to attach context to the error, which is useful for debugging.
export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    requestResourceData?: any;
};
  
export class FirestorePermissionError extends Error {
    context: SecurityRuleContext;

    constructor(context: SecurityRuleContext) {
        const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(context, null, 2)}`;
        super(message);
        this.name = 'FirestorePermissionError';
        this.context = context;
        // This is to make the error object serializable for the dev overlay.
        Object.setPrototypeOf(this, FirestorePermissionError.prototype);
    }
}
