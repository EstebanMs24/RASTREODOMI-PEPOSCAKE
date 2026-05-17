import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface DeleteRequest {
  userId: string
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const body: DeleteRequest = await req.json()

    if (!body.userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user info for audit log
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', body.userId)
      .single()

    const userName = userData?.full_name || body.userId

    // Delete user profile first (will cascade if RLS allows)
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', body.userId)

    if (profileError) {
      console.error('Profile deletion error:', profileError)
      return new Response(
        JSON.stringify({ error: `Failed to delete user profile: ${profileError.message}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(body.userId)

    if (authError) {
      console.error('Auth deletion error:', authError)
      return new Response(
        JSON.stringify({ error: `Failed to delete auth user: ${authError?.message}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Register in audit_logs
    const { data: { user: currentUser } } = await supabase.auth.admin.getUserById(body.userId)

    await supabase.from('audit_logs').insert([{
      action: 'delete_deliverer',
      entity_type: 'deliverer',
      entity_id: body.userId,
      entity_name: userName,
      performed_by: null,
      performed_by_name: 'Admin API',
      old_value: 'Activo',
      new_value: 'Eliminado',
    }]).catch(() => {}) // Ignorar errores de auditoría

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Deliverer deleted successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
