# Debugging Translation Key Errors in Gauhati University Hospital HMS

This guide will help you identify and fix translation key errors in the application. Translation key errors typically manifest as missing translations or untranslated text displayed directly as keys.

## Common Issues and How to Fix Them

### 1. Missing Translation Keys

**Symptoms:**
- Text appears as translation keys like `settings.language` instead of actual translated text
- Parts of the interface show English text while other parts show translated text
- Console errors showing "Translation key [KEY] not found"

**How to Debug:**

1. **Check the console logs**:
   - Open your browser developer tools (F12 or right-click → Inspect)
   - Look for warnings or errors related to missing translation keys

2. **Verify key exists in translation files**:
   - Open the translation files in `client/src/locales/`
   - Check if the key mentioned in the error exists in all language files
   - Ensure the key structure (e.g., `settings.language`) matches exactly

3. **Add missing keys**:
   - If the key doesn't exist, add it to all language files (en.json, hi.json, as.json)
   - Make sure the key is added with the exact same path structure

### 2. Namespace Issues

**Symptoms:**
- Console errors showing "Namespace not found"
- All translations in a specific section are missing

**How to Debug:**

1. **Check namespace imports**:
   - Verify that the component includes the correct namespace in its i18n initialization
   - Look for the correct usage of `useTranslation()` hook with proper namespace

2. **Check namespace definitions**:
   - Ensure all namespaces are properly defined in `client/src/lib/i18n.ts`
   - Make sure the namespace has been added to the list of resources

### 3. Language Switch Not Working

**Symptoms:**
- Language doesn't change when selected
- Some parts of the UI change language but others don't

**How to Debug:**

1. **Check Language Context**:
   - Examine `client/src/context/LanguageContext.tsx`
   - Ensure the `changeLanguage` function is working correctly
   - Verify that all components consuming the language context are re-rendering

2. **Check for Components Not Using Translation Hook**:
   - Identify components with hardcoded strings
   - Replace hardcoded strings with translation keys

### 4. Translation Loading Issues

**Symptoms:**
- Initial page load shows translation keys, then they get translated
- Some translations work in one part of the app but not in another

**How to Debug:**

1. **Check async loading**:
   - Verify that translations are being loaded before they're needed
   - Add loading states for components that depend on translations

## Advanced Debugging Techniques

### Using Debug Mode in i18next

To enable detailed debug information, modify the i18n configuration:

```typescript
// in client/src/lib/i18n.ts
i18n.init({
  debug: true,  // Add this line
  resources: {...},
  // other config
});
```

This will provide detailed logs in the console showing:
- Which keys were looked up
- Which namespaces were checked
- When translations are missing

### Testing Individual Keys

You can test if a specific key exists and get its translation using:

```typescript
// In any component with the useTranslation hook
const { t, i18n } = useTranslation();

// Check if a key exists
const exists = i18n.exists('settings.language');
console.log('Key exists:', exists);

// Get current translation
const translation = t('settings.language');
console.log('Translation:', translation);
```

### Checking for Incomplete Translations

To find all missing translations:

1. Create a script to compare keys between language files
2. Run it to identify keys that exist in the primary language but not in others
3. Add the missing keys to complete the translations

## Best Practices

1. **Always use consistent naming conventions** for translation keys
2. **Group related translations** under common namespaces
3. **Add new translations to all language files** at the same time
4. **Comment complex translations** to provide context
5. **Use variables** instead of concatenating strings for phrases with dynamic content

## Quick Reference for Common Errors

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "Translation key not found" | Key missing in translation file | Add the key to all language files |
| "Namespace not found" | Namespace not loaded or missing | Add namespace to i18n configuration |
| "Invalid key" | Malformed key structure | Check key formatting and nesting |
| No error but wrong language | Context not updated | Check LanguageContext implementation |
| Text flickers between key and translation | Async loading issues | Add loading states to components |

By following this guide, you should be able to identify and fix most translation-related issues in the application.