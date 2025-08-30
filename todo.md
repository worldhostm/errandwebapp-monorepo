# Lint Errors Todo List

## TypeScript Errors Found

### 1. authController.ts:33 - user._id type issue
- **Location**: `apps/backend/src/controllers/authController.ts:33`
- **Error**: `'user._id' is of type 'unknown'`
- **Status**: ✅ Fixed

### 2. authController.ts:71 - user._id type issue
- **Location**: `apps/backend/src/controllers/authController.ts:71`
- **Error**: `'user._id' is of type 'unknown'`
- **Status**: ✅ Fixed

### 3. chatController.ts:21 - user._id type issue
- **Location**: `apps/backend/src/controllers/chatController.ts:21`
- **Error**: `'user._id' is of type 'unknown'`
- **Status**: ✅ Fixed

### 4. chatController.ts:22 - user._id type issue
- **Location**: `apps/backend/src/controllers/chatController.ts:22`
- **Error**: `'user._id' is of type 'unknown'`
- **Status**: ✅ Fixed

### 5. chatController.ts:62 - ObjectId argument type issue
- **Location**: `apps/backend/src/controllers/chatController.ts:62`
- **Error**: `Argument of type 'unknown' is not assignable to parameter of type 'ObjectId'`
- **Status**: ✅ Fixed

### 6. chatController.ts:74 - IMessage property type issue
- **Location**: `apps/backend/src/controllers/chatController.ts:74`
- **Error**: `Type '{ sender: unknown; ... }' is not assignable to parameter of type 'IMessage'`
- **Status**: ✅ Fixed

### 7. chatController.ts:75 - IMessage assignment issue
- **Location**: `apps/backend/src/controllers/chatController.ts:75`
- **Error**: `Type '{ sender: unknown; ... }' is not assignable to type 'IMessage'`
- **Status**: ✅ Fixed

### 8. chatController.ts:107 - ObjectId argument type issue
- **Location**: `apps/backend/src/controllers/chatController.ts:107`
- **Error**: `Argument of type 'unknown' is not assignable to parameter of type 'ObjectId'`
- **Status**: ✅ Fixed

### 9. chatController.ts:113 - user._id type issue
- **Location**: `apps/backend/src/controllers/chatController.ts:113`
- **Error**: `'user._id' is of type 'unknown'`
- **Status**: ✅ Fixed

### 10. errandController.ts:118 - user._id type issue
- **Location**: `apps/backend/src/controllers/errandController.ts:118`
- **Error**: `'user._id' is of type 'unknown'`
- **Status**: ✅ Fixed

### 11. errandController.ts:122 - ObjectId assignment issue
- **Location**: `apps/backend/src/controllers/errandController.ts:122`
- **Error**: `Type 'unknown' is not assignable to type 'ObjectId | undefined'`
- **Status**: ✅ Fixed

### 12. errandController.ts:134 - string array parameter issue
- **Location**: `apps/backend/src/controllers/errandController.ts:134`
- **Error**: `Argument of type 'string[]' is not assignable to parameter of type 'string'`
- **Status**: ✅ Fixed

### 13. errandController.ts:166 - user._id type issue
- **Location**: `apps/backend/src/controllers/errandController.ts:166`
- **Error**: `'user._id' is of type 'unknown'`
- **Status**: ✅ Fixed

### 14. errandController.ts:172 - string array parameter issue
- **Location**: `apps/backend/src/controllers/errandController.ts:172`
- **Error**: `Argument of type 'string[]' is not assignable to parameter of type 'string'`
- **Status**: ✅ Fixed

### 15. errandController.ts:252 - user._id type issue
- **Location**: `apps/backend/src/controllers/errandController.ts:252`
- **Error**: `'user._id' is of type 'unknown'`
- **Status**: ✅ Fixed

### 16. User.ts:87 - CallbackError type issue
- **Location**: `apps/backend/src/models/User.ts:87`
- **Error**: `Argument of type 'unknown' is not assignable to parameter of type 'CallbackError | undefined'`
- **Status**: ✅ Fixed

### 17. socketService.ts:27 - user._id type issue
- **Location**: `apps/backend/src/services/socketService.ts:27`
- **Error**: `'user._id' is of type 'unknown'`
- **Status**: ✅ Fixed

## Summary
- **Total Errors**: 17
- **Fixed**: 17
- **Remaining**: 0