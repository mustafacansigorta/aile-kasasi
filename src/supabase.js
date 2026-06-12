import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vipobwwxyzufopxckorr.supabase.co";
const supabaseKey = "sb_publishable_071Wdh_dN20kwCFhLJNtMg_MFPjoRYM";

export const supabase = createClient(supabaseUrl, supabaseKey);
