export interface ENV {
  ASSET_HOST: string;
  active_brand_config_json_url: string;
  active_brand_config: {
    md5: string;
    variables: Record<string, string>;
    share: boolean;
    name?: null;
    created_at: string;
    js_overrides: string;
    css_overrides: string;
    parent_md5: string;
    mobile_js_overrides: string;
    mobile_css_overrides: string;
  };
  confetti_branding_enabled: boolean;
  url_to_what_gets_loaded_inside_the_tinymce_editor_css?: string[] | null;
  url_for_high_contrast_tinymce_editor_css?: string[] | null;
  current_user_id: string;
  current_user_global_id: string;
  current_user_heap_id: string;
  current_user_roles?: string[] | null;
  current_user_is_student: boolean;
  current_user_types?: string[] | null;
  current_user_disabled_inbox: boolean;
  current_user_visited_tabs?: null;
  discussions_reporting: boolean;
  files_domain: string;
  group_information?: null;
  DOMAIN_ROOT_ACCOUNT_ID: string;
  k12: boolean;
  help_link_name: string;
  help_link_icon: string;
  use_high_contrast: boolean;
  auto_show_cc: boolean;
  disable_celebrations: boolean;
  disable_keyboard_shortcuts: boolean;
  LTI_LAUNCH_FRAME_ALLOWANCES?: string[] | null;
  DEEP_LINKING_POST_MESSAGE_ORIGIN: string;
  DEEP_LINKING_LOGGING?: null;
  comment_library_suggestions_enabled: boolean;
  SETTINGS: {
    open_registration: boolean;
    collapse_global_nav: boolean;
    release_notes_badge_disabled: boolean;
  };
  FULL_STORY_ENABLED: boolean;
  RAILS_ENVIRONMENT: string;
}
