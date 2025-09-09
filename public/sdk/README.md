# NPS Widget SDK v2.0.0

A comprehensive JavaScript SDK for integrating NPS (Net Promoter Score) surveys into any website with advanced features like API key authentication, CORS handling, and CSP compliance.

## Features

- ✅ **API Key Authentication** - Secure access to your surveys
- ✅ **CORS & CSP Compliant** - Works with strict security policies
- ✅ **7 Widget Positions** - Bottom/top corners, center modal, slide animations
- ✅ **URL Targeting** - Show surveys on specific pages or patterns
- ✅ **SPA Support** - Works with React, Vue, Angular, and other SPAs
- ✅ **Customizable Styling** - Colors, timing, and appearance options
- ✅ **Response Callbacks** - Integrate with your analytics
- ✅ **Auto JSONP Fallback** - Handles strict CSP environments
- ✅ **Mobile Responsive** - Works on all devices

## Quick Start

### 1. Basic Integration

```html
<!-- Load the SDK -->
<script src="https://melodic-melba-d65cd6.netlify.app/sdk/nps-widget-sdk.js"></script>

<!-- Initialize with your API key -->
<script>
  new NPSWidget({
    apiKey: 'nps_your_api_key_here',
    position: 'bottom-right',
    primaryColor: '#4F46E5',
    delay: 5000
  });
</script>
```

### 2. Advanced Configuration

```javascript
new NPSWidget({
  apiKey: 'nps_your_api_key_here',
  
  // Positioning
  position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left, center, slide-up, slide-down
  
  // Styling
  primaryColor: '#4F46E5',
  roundedCorners: true,
  closeButton: true,
  progressBar: true,
  
  // Timing
  delay: 5000,
  autoFadeOut: true,
  fadeOutDelay: 3000,
  
  // Behavior
  showOnce: false,
  autoRotate: true,
  
  // URL Targeting
  urlTargeting: {
    enabled: true,
    mode: 'include', // 'all', 'include', 'exclude'
    patterns: [
      { type: 'contains', value: '/product' },
      { type: 'starts_with', value: 'https://example.com/blog' }
    ]
  },
  
  // SPA Support
  spaMode: true,
  
  // Callbacks
  onResponse: function(data) {
    console.log('NPS Response:', data);
    // Send to your analytics
    gtag('event', 'nps_response', {
      score: data.score,
      survey_id: data.survey.id
    });
  },
  
  onShow: function(survey) {
    console.log('Widget shown:', survey.name);
  },
  
  onClose: function() {
    console.log('Widget closed');
  },
  
  onError: function(message, error) {
    console.error('Widget error:', message, error);
  }
});
```

## Configuration Options

### Positioning Options

| Position | Description |
|----------|-------------|
| `bottom-right` | Fixed position in bottom-right corner |
| `bottom-left` | Fixed position in bottom-left corner |
| `top-right` | Fixed position in top-right corner |
| `top-left` | Fixed position in top-left corner |
| `center` | Modal popup in center of screen |
| `slide-up` | Slides up from bottom center |
| `slide-down` | Slides down from top center |

### URL Targeting

Target specific pages or URL patterns:

```javascript
urlTargeting: {
  enabled: true,
  mode: 'include', // Show only on these URLs
  patterns: [
    { type: 'exact', value: 'https://example.com/pricing' },
    { type: 'contains', value: '/product' },
    { type: 'starts_with', value: 'https://example.com/blog' },
    { type: 'regex', value: '.*\/checkout\/.*' }
  ]
}
```

### SPA (Single Page Application) Support

For React, Vue, Angular, and other SPAs:

```javascript
new NPSWidget({
  apiKey: 'nps_your_api_key_here',
  spaMode: true, // Monitors URL changes without page reloads
  urlTargeting: {
    enabled: true,
    mode: 'include',
    patterns: [
      { type: 'contains', value: '/dashboard' }
    ]
  }
});
```

## API Methods

### Instance Methods

```javascript
const widget = new NPSWidget({ apiKey: 'nps_...' });

// Show widget manually
widget.show();

// Hide widget (without removing)
widget.hide();

// Close and remove widget
widget.close();

// Destroy widget completely
widget.destroy();

// Update configuration
widget.updateConfig({
  position: 'center',
  primaryColor: '#FF6B6B'
});

// Get current status
const status = widget.getStatus();
console.log(status.isVisible, status.surveysCount);
```

## Framework Integration

### React

```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const widget = new NPSWidget({
      apiKey: 'nps_your_api_key_here',
      position: 'bottom-right',
      spaMode: true,
      onResponse: (data) => {
        // Handle response
        console.log('NPS Response:', data);
      }
    });

    return () => {
      widget.destroy();
    };
  }, []);

  return <div>Your App</div>;
}
```

### Vue.js

```vue
<template>
  <div>Your App</div>
</template>

<script>
export default {
  mounted() {
    this.widget = new NPSWidget({
      apiKey: 'nps_your_api_key_here',
      position: 'bottom-right',
      spaMode: true
    });
  },
  
  beforeDestroy() {
    if (this.widget) {
      this.widget.destroy();
    }
  }
}
</script>
```

### Angular

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '<div>Your App</div>'
})
export class AppComponent implements OnInit, OnDestroy {
  private widget: any;

  ngOnInit() {
    this.widget = new (window as any).NPSWidget({
      apiKey: 'nps_your_api_key_here',
      position: 'bottom-right',
      spaMode: true
    });
  }

  ngOnDestroy() {
    if (this.widget) {
      this.widget.destroy();
    }
  }
}
```

## CORS & CSP Handling

The SDK automatically handles CORS and Content Security Policy issues:

### CORS Support
- Automatic CORS headers handling
- JSONP fallback for strict environments
- Origin validation and whitelisting

### CSP Compliance
- No inline styles (uses CSS custom properties)
- No eval() or unsafe operations
- Nonce support for strict CSP environments

### CSP Configuration Example

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://melodic-melba-d65cd6.netlify.app;
  connect-src 'self' https://melodic-melba-d65cd6.netlify.app;
  style-src 'self' 'unsafe-inline';
">
```

## Error Handling

```javascript
new NPSWidget({
  apiKey: 'nps_your_api_key_here',
  onError: function(message, error) {
    // Log errors to your monitoring service
    console.error('NPS Widget Error:', message, error);
    
    // Send to error tracking
    if (window.Sentry) {
      Sentry.captureException(new Error(message));
    }
  }
});
```

## Analytics Integration

### Google Analytics

```javascript
new NPSWidget({
  apiKey: 'nps_your_api_key_here',
  onResponse: function(data) {
    gtag('event', 'nps_response', {
      event_category: 'NPS',
      event_label: data.survey.name,
      value: data.score
    });
  },
  onShow: function(survey) {
    gtag('event', 'nps_widget_shown', {
      event_category: 'NPS',
      event_label: survey.name
    });
  }
});
```

### Mixpanel

```javascript
new NPSWidget({
  apiKey: 'nps_your_api_key_here',
  onResponse: function(data) {
    mixpanel.track('NPS Response', {
      score: data.score,
      survey_id: data.survey.id,
      survey_name: data.survey.name
    });
  }
});
```

## Troubleshooting

### Common Issues

1. **Widget not showing**
   - Check API key is valid
   - Verify surveys are published
   - Check URL targeting rules
   - Look for console errors

2. **CORS errors**
   - SDK automatically handles CORS
   - Check CSP headers if using strict policies
   - Verify domain is whitelisted

3. **SPA not working**
   - Enable `spaMode: true`
   - Check URL targeting patterns
   - Verify framework integration

### Debug Mode

Enable debug logging in development:

```javascript
// Debug mode is automatically enabled on localhost and StackBlitz
// Check browser console for detailed logs
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers supported

## Security

- API key authentication
- Origin validation
- XSS protection with HTML escaping
- CSP compliance
- No sensitive data stored in localStorage

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Documentation: https://melodic-melba-d65cd6.netlify.app/docs
- Issues: Create an issue in the repository
- Email: support@npswidget.com