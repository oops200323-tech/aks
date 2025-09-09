<?php
/**
 * Plugin Name: NPS Widget
 * Description: Easily add NPS surveys to your WordPress site
 * Version: 1.0.0
 * Author: Your Name
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class NPSWidget {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_footer', array($this, 'add_widget_script'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    public function init() {
        // Plugin initialization
    }
    
    public function add_admin_menu() {
        add_options_page(
            'NPS Widget Settings',
            'NPS Widget',
            'manage_options',
            'nps-widget',
            array($this, 'admin_page')
        );
    }
    
    public function register_settings() {
        register_setting('nps_widget_settings', 'nps_widget_options');
    }
    
    public function admin_page() {
        $options = get_option('nps_widget_options', array());
        ?>
        <div class="wrap">
            <h1>NPS Widget Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('nps_widget_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">Widget Type</th>
                        <td>
                            <select name="nps_widget_options[type]">
                                <option value="universal" <?php selected($options['type'] ?? '', 'universal'); ?>>Universal (All Surveys)</option>
                                <option value="specific" <?php selected($options['type'] ?? '', 'specific'); ?>>Specific Survey</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Survey ID</th>
                        <td>
                            <input type="text" name="nps_widget_options[survey_id]" value="<?php echo esc_attr($options['survey_id'] ?? ''); ?>" class="regular-text" />
                            <p class="description">Required only for specific survey type</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Position</th>
                        <td>
                            <select name="nps_widget_options[position]">
                                <option value="bottom-right" <?php selected($options['position'] ?? '', 'bottom-right'); ?>>Bottom Right</option>
                                <option value="bottom-left" <?php selected($options['position'] ?? '', 'bottom-left'); ?>>Bottom Left</option>
                                <option value="top-right" <?php selected($options['position'] ?? '', 'top-right'); ?>>Top Right</option>
                                <option value="top-left" <?php selected($options['position'] ?? '', 'top-left'); ?>>Top Left</option>
                                <option value="center" <?php selected($options['position'] ?? '', 'center'); ?>>Center</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Delay (seconds)</th>
                        <td>
                            <input type="number" name="nps_widget_options[delay]" value="<?php echo esc_attr($options['delay'] ?? '5'); ?>" min="1" max="60" />
                            <p class="description">How long to wait before showing the widget</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Show Once Per User</th>
                        <td>
                            <input type="checkbox" name="nps_widget_options[show_once]" value="1" <?php checked($options['show_once'] ?? '', '1'); ?> />
                            <label>Only show the widget once per user</label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Auto Rotate Surveys</th>
                        <td>
                            <input type="checkbox" name="nps_widget_options[auto_rotate]" value="1" <?php checked($options['auto_rotate'] ?? '1', '1'); ?> />
                            <label>Automatically rotate between multiple surveys (Universal only)</label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Enable Widget</th>
                        <td>
                            <input type="checkbox" name="nps_widget_options[enabled]" value="1" <?php checked($options['enabled'] ?? '', '1'); ?> />
                            <label>Enable the NPS widget on your site</label>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            
            <h2>Implementation Code</h2>
            <p>If you prefer to add the widget manually, use this code:</p>
            <textarea readonly style="width: 100%; height: 200px; font-family: monospace;"><?php echo $this->get_widget_code(); ?></textarea>
        </div>
        <?php
    }
    
    public function add_widget_script() {
        $options = get_option('nps_widget_options', array());
        
        if (empty($options['enabled'])) {
            return;
        }
        
        $type = $options['type'] ?? 'universal';
        $position = $options['position'] ?? 'bottom-right';
        $delay = ($options['delay'] ?? 5) * 1000; // Convert to milliseconds
        $show_once = !empty($options['show_once']) ? 'true' : 'false';
        $auto_rotate = !empty($options['auto_rotate']) ? 'true' : 'false';
        
        if ($type === 'universal') {
            ?>
            <script>
            (function() {
                var script = document.createElement('script');
                script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-universal.js';
                script.setAttribute('data-position', '<?php echo esc_js($position); ?>');
                script.setAttribute('data-delay', '<?php echo esc_js($delay); ?>');
                script.setAttribute('data-auto-rotate', '<?php echo esc_js($auto_rotate); ?>');
                script.setAttribute('data-show-once', '<?php echo esc_js($show_once); ?>');
                document.head.appendChild(script);
            })();
            </script>
            <?php
        } elseif ($type === 'specific' && !empty($options['survey_id'])) {
            $survey_id = $options['survey_id'];
            ?>
            <script>
            (function() {
                var script = document.createElement('script');
                script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-widget.js';
                script.setAttribute('data-survey-id', '<?php echo esc_js($survey_id); ?>');
                script.setAttribute('data-position', '<?php echo esc_js($position); ?>');
                script.setAttribute('data-delay', '<?php echo esc_js($delay); ?>');
                document.head.appendChild(script);
            })();
            </script>
            <?php
        }
    }
    
    private function get_widget_code() {
        $options = get_option('nps_widget_options', array());
        $type = $options['type'] ?? 'universal';
        $position = $options['position'] ?? 'bottom-right';
        $delay = ($options['delay'] ?? 5) * 1000;
        $show_once = !empty($options['show_once']) ? 'true' : 'false';
        $auto_rotate = !empty($options['auto_rotate']) ? 'true' : 'false';
        
        if ($type === 'universal') {
            return "<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-universal.js';
  script.setAttribute('data-position', '{$position}');
  script.setAttribute('data-delay', '{$delay}');
  script.setAttribute('data-auto-rotate', '{$auto_rotate}');
  script.setAttribute('data-show-once', '{$show_once}');
  document.head.appendChild(script);
})();
</script>";
        } else {
            $survey_id = $options['survey_id'] ?? 'your-survey-id';
            return "<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-widget.js';
  script.setAttribute('data-survey-id', '{$survey_id}');
  script.setAttribute('data-position', '{$position}');
  script.setAttribute('data-delay', '{$delay}');
  document.head.appendChild(script);
})();
</script>";
        }
    }
}

// Initialize the plugin
new NPSWidget();

// Shortcode for inline surveys
function nps_survey_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => '',
    ), $atts);
    
    if (empty($atts['id'])) {
        return '<p>Error: Survey ID is required</p>';
    }
    
    $container_id = 'nps-survey-' . uniqid();
    
    ob_start();
    ?>
    <div id="<?php echo esc_attr($container_id); ?>" style="min-height: 300px; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
        Loading survey...
    </div>
    <script>
    (function() {
        var script = document.createElement('script');
        script.src = 'https://melodic-melba-d65cd6.netlify.app/nps-inline.js';
        script.setAttribute('data-survey-id', '<?php echo esc_js($atts['id']); ?>');
        script.setAttribute('data-container', '<?php echo esc_js($container_id); ?>');
        document.head.appendChild(script);
    })();
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('nps_survey', 'nps_survey_shortcode');