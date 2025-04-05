import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export interface CustomerData {
  username: string
  password: string
  email: string
  firstName: string
  lastName: string
  phone: string
  nickname?: string
  description?: string
  billing?: {
    firstName?: string
    lastName?: string
    company?: string
    address1?: string
    address2?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
    phone?: string
  }
  shipping?: {
    firstName?: string
    lastName?: string
    company?: string
    address1?: string
    address2?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }
}

/**
 * Gets all customers or a specific customer by ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // If ID is provided, get a specific customer
    if (id) {
      const userId = BigInt(id)
      
      // Get user from wp_users
      const user = await prisma.wp_users.findUnique({
        where: { ID: userId }
      })
      
      if (!user) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        )
      }
      
      // Get customer metadata from wp_usermeta
      const userMeta = await prisma.wp_usermeta.findMany({
        where: { user_id: userId }
      })
      
      // Convert metadata array to object for easier access
      const metaObj: Record<string, string> = {}
      userMeta.forEach(meta => {
        if (meta.meta_key && meta.meta_value) {
          metaObj[meta.meta_key] = meta.meta_value
        }
      })
      
      // Get WooCommerce customer data
      const wooCustomer = await prisma.wp_wc_customer_lookup.findFirst({
        where: { user_id: userId }
      })
      
      const customer = {
        id: user.ID.toString(),
        username: user.user_login,
        email: user.user_email,
        displayName: user.display_name,
        firstName: metaObj['first_name'] || '',
        lastName: metaObj['last_name'] || '',
        phone: (user as any).phone || metaObj['phone'] || metaObj['billing_phone'] || '',
        dateRegistered: user.user_registered,
        lastActive: wooCustomer?.date_last_active || null,
        billing: {
          firstName: metaObj['billing_first_name'] || '',
          lastName: metaObj['billing_last_name'] || '',
          company: metaObj['billing_company'] || '',
          address1: metaObj['billing_address_1'] || '',
          address2: metaObj['billing_address_2'] || '',
          city: metaObj['billing_city'] || '',
          state: metaObj['billing_state'] || '',
          postcode: metaObj['billing_postcode'] || '',
          country: metaObj['billing_country'] || '',
          phone: metaObj['billing_phone'] || '',
          email: metaObj['billing_email'] || user.user_email
        },
        shipping: {
          firstName: metaObj['shipping_first_name'] || '',
          lastName: metaObj['shipping_last_name'] || '',
          company: metaObj['shipping_company'] || '',
          address1: metaObj['shipping_address_1'] || '',
          address2: metaObj['shipping_address_2'] || '',
          city: metaObj['shipping_city'] || '',
          state: metaObj['shipping_state'] || '',
          postcode: metaObj['shipping_postcode'] || '',
          country: metaObj['shipping_country'] || ''
        }
      }
      
      return NextResponse.json(customer)
    } 
    // Otherwise, get all customers with pagination
    else {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = (page - 1) * limit
      
      // Fetch customers with a JOIN to get first and last name from the customer lookup table
      const customers = await prisma.$queryRaw<
        Array<{
          ID: bigint;
          user_login: string;
          user_email: string;
          display_name: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          date_registered: Date;
          date_last_active: Date | null;
        }>
      >`
        SELECT u.ID, u.user_login, u.user_email, u.display_name, u.phone,
               cl.first_name, cl.last_name, 
               u.user_registered as date_registered,
               cl.date_last_active
        FROM wp_users u
        LEFT JOIN wp_wc_customer_lookup cl ON u.ID = cl.user_id
        WHERE EXISTS (
          SELECT 1 FROM wp_usermeta um 
          WHERE um.user_id = u.ID 
          AND um.meta_key = 'wp_capabilities' 
          AND um.meta_value LIKE '%customer%'
        )
        ORDER BY u.user_registered DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      
      // Count total customers for pagination
      const countResult = await prisma.$queryRaw<[{ total: bigint }]>`
        SELECT COUNT(*) as total
        FROM wp_users u
        WHERE EXISTS (
          SELECT 1 FROM wp_usermeta um 
          WHERE um.user_id = u.ID 
          AND um.meta_key = 'wp_capabilities' 
          AND um.meta_value LIKE '%customer%'
        )
      `
      
      const total = Number(countResult[0].total)
      
      // Format customer data
      const formattedCustomers = customers.map(customer => ({
        id: customer.ID.toString(),
        username: customer.user_login,
        email: customer.user_email,
        displayName: customer.display_name,
        firstName: customer.first_name || '',
        lastName: customer.last_name || '',
        phone: customer.phone || '',
        dateRegistered: customer.date_registered
      }))
      
      return NextResponse.json({
        customers: formattedCustomers,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      })
    }
  } catch (error) {
    console.error('Failed to fetch customers:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch customers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Creates a new customer in WooCommerce/WordPress
 */
export async function POST(request: Request) {
  try {
    const data: CustomerData = await request.json()
    
    // Input validation - now includes phone
    if (!data.username || !data.password || !data.email || !data.firstName || !data.lastName || !data.phone) {
      return NextResponse.json(
        { error: 'Required fields missing', requiredFields: ['username', 'password', 'email', 'firstName', 'lastName', 'phone'] },
        { status: 400 }
      )
    }

    // Check if the user already exists
    const existingUser = await prisma.wp_users.findFirst({
      where: {
        OR: [
          { user_login: data.username },
          { user_email: data.email }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this username or email already exists' },
        { status: 409 }
      )
    }

    // Hash the password (bcrypt)
    const hashedPassword = await hash(data.password, 10)
    
    // Create the new user with all related metadata in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the user in wp_users - now including phone
      // Note: The phone field might need to be handled differently based on your schema
      const userData: any = {
        user_login: data.username,
        user_pass: hashedPassword,
        user_nicename: data.username.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        user_email: data.email,
        user_url: '',
        user_registered: new Date(),
        user_activation_key: '',
        user_status: 0,
        display_name: `${data.firstName} ${data.lastName}`
      }
      
      // Only add phone if it's supported by the schema
      if ('phone' in prisma.wp_users.fields) {
        userData.phone = data.phone
      }
      
      const user = await tx.wp_users.create({
        data: userData
      })

      const userId = user.ID

      // 2. Add user metadata
      const userMetaData = [
        { user_id: userId, meta_key: 'nickname', meta_value: data.nickname || data.username },
        { user_id: userId, meta_key: 'first_name', meta_value: data.firstName },
        { user_id: userId, meta_key: 'last_name', meta_value: data.lastName },
        { user_id: userId, meta_key: 'description', meta_value: data.description || '' },
        { user_id: userId, meta_key: 'rich_editing', meta_value: 'true' },
        { user_id: userId, meta_key: 'syntax_highlighting', meta_value: 'true' },
        { user_id: userId, meta_key: 'comment_shortcuts', meta_value: 'false' },
        { user_id: userId, meta_key: 'admin_color', meta_value: 'fresh' },
        { user_id: userId, meta_key: 'use_ssl', meta_value: '0' },
        { user_id: userId, meta_key: 'show_admin_bar_front', meta_value: 'true' },
        { user_id: userId, meta_key: 'locale', meta_value: '' },
        { user_id: userId, meta_key: 'wp_capabilities', meta_value: 'a:1:{s:8:"customer";b:1;}' },
        { user_id: userId, meta_key: 'wp_user_level', meta_value: '0' },
        { user_id: userId, meta_key: 'dismissed_wp_pointers', meta_value: '' },
        { user_id: userId, meta_key: 'last_update', meta_value: Math.floor(Date.now() / 1000).toString() },
        { user_id: userId, meta_key: 'phone', meta_value: data.phone }  // Add phone to user metadata
      ]

      // Add billing information if provided
      if (data.billing) {
        userMetaData.push(
          { user_id: userId, meta_key: 'billing_first_name', meta_value: data.billing.firstName || data.firstName },
          { user_id: userId, meta_key: 'billing_last_name', meta_value: data.billing.lastName || data.lastName },
          { user_id: userId, meta_key: 'billing_company', meta_value: data.billing.company || '' },
          { user_id: userId, meta_key: 'billing_address_1', meta_value: data.billing.address1 || '' },
          { user_id: userId, meta_key: 'billing_address_2', meta_value: data.billing.address2 || '' },
          { user_id: userId, meta_key: 'billing_city', meta_value: data.billing.city || '' },
          { user_id: userId, meta_key: 'billing_state', meta_value: data.billing.state || '' },
          { user_id: userId, meta_key: 'billing_postcode', meta_value: data.billing.postcode || '' },
          { user_id: userId, meta_key: 'billing_country', meta_value: data.billing.country || '' },
          { user_id: userId, meta_key: 'billing_phone', meta_value: data.billing.phone || data.phone },  // Use provided billing phone or fall back to main phone
          { user_id: userId, meta_key: 'billing_email', meta_value: data.email }
        )
      } else {
        // If no billing info is provided, still add the phone number to billing
        userMetaData.push(
          { user_id: userId, meta_key: 'billing_phone', meta_value: data.phone },
          { user_id: userId, meta_key: 'billing_email', meta_value: data.email }
        )
      }

      // Add shipping information if provided
      if (data.shipping) {
        userMetaData.push(
          { user_id: userId, meta_key: 'shipping_first_name', meta_value: data.shipping.firstName || data.firstName },
          { user_id: userId, meta_key: 'shipping_last_name', meta_value: data.shipping.lastName || data.lastName },
          { user_id: userId, meta_key: 'shipping_company', meta_value: data.shipping.company || '' },
          { user_id: userId, meta_key: 'shipping_address_1', meta_value: data.shipping.address1 || '' },
          { user_id: userId, meta_key: 'shipping_address_2', meta_value: data.shipping.address2 || '' },
          { user_id: userId, meta_key: 'shipping_city', meta_value: data.shipping.city || '' },
          { user_id: userId, meta_key: 'shipping_state', meta_value: data.shipping.state || '' },
          { user_id: userId, meta_key: 'shipping_postcode', meta_value: data.shipping.postcode || '' },
          { user_id: userId, meta_key: 'shipping_country', meta_value: data.shipping.country || '' }
        )
      }

      // Add all metadata in a single batch
      await tx.wp_usermeta.createMany({
        data: userMetaData
      })

      // 3. Add customer to WooCommerce customer lookup table
      await tx.wp_wc_customer_lookup.create({
        data: {
          user_id: userId,
          username: data.username,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          date_registered: new Date(),
          date_last_active: new Date(),
          country: data.billing?.country || '',
          postcode: data.billing?.postcode || '',
          city: data.billing?.city || '',
          state: data.billing?.state || ''
        }
      })

      // 4. Initialize empty shopping cart
      await tx.wp_usermeta.create({
        data: {
          user_id: userId,
          meta_key: '_woocommerce_persistent_cart_1',
          meta_value: 'a:1:{s:4:"cart";a:0:{}}'
        }
      })

      // 5. Update user count in wp_options
      const userCount = await tx.wp_users.count()
      await tx.wp_options.update({
        where: { option_name: 'user_count' },
        data: { option_value: userCount.toString() }
      })

      // Return customer data
      const customerData = {
        id: userId.toString(),
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: `${data.firstName} ${data.lastName}`
      }

      // Add phone to response
      return {
        ...customerData,
        phone: data.phone
      }
    })

    return NextResponse.json({
      success: true,
      customer: result
    })
  } catch (error) {
    console.error('Failed to create customer:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create customer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
