import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export interface CustomerData {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  nickname?: string;
  description?: string;
  billing?: {
    firstName?: string;
    lastName?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    phone?: string;
  };
  shipping?: {
    firstName?: string;
    lastName?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface CustomerCreateResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string;
}

/**
 * Creates a new customer in the WooCommerce/WordPress database
 */
export async function createCustomer(data: CustomerData): Promise<CustomerCreateResponse> {
  // Check if the user already exists
  const existingUser = await prisma.wp_users.findFirst({
    where: {
      OR: [{ user_login: data.username }, { user_email: data.email }],
    },
  });

  if (existingUser) {
    throw new Error("User with this username or email already exists");
  }

  // Hash the password (bcrypt)
  const hashedPassword = await hash(data.password, 10);

  // Create the new user with all related metadata in a transaction
  return prisma.$transaction(async (tx) => {
    // 1. Create the user in wp_users - now including phone
    // Note: The phone field might need to be handled differently based on your schema
    const userData: any = {
      user_login: data.username,
      user_pass: hashedPassword,
      user_nicename: data.username.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      user_email: data.email,
      user_url: "",
      user_registered: new Date(),
      user_activation_key: "",
      user_status: 0,
      display_name: `${data.firstName} ${data.lastName}`,
    };

    // Only add phone if it's supported by the schema
    if ("phone" in prisma.wp_users.fields) {
      userData.phone = data.phone;
    }

    const user = await tx.wp_users.create({
      data: userData,
    });

    const userId = user.ID;

    // 2. Add user metadata
    const userMetaData = [
      {
        user_id: userId,
        meta_key: "nickname",
        meta_value: data.nickname || data.username,
      },
      { user_id: userId, meta_key: "first_name", meta_value: data.firstName },
      { user_id: userId, meta_key: "last_name", meta_value: data.lastName },
      {
        user_id: userId,
        meta_key: "description",
        meta_value: data.description || "",
      },
      { user_id: userId, meta_key: "rich_editing", meta_value: "true" },
      {
        user_id: userId,
        meta_key: "syntax_highlighting",
        meta_value: "true",
      },
      { user_id: userId, meta_key: "comment_shortcuts", meta_value: "false" },
      { user_id: userId, meta_key: "admin_color", meta_value: "fresh" },
      { user_id: userId, meta_key: "use_ssl", meta_value: "0" },
      {
        user_id: userId,
        meta_key: "show_admin_bar_front",
        meta_value: "true",
      },
      { user_id: userId, meta_key: "locale", meta_value: "" },
      {
        user_id: userId,
        meta_key: "wp_capabilities",
        meta_value: 'a:1:{s:8:"customer";b:1;}',
      },
      { user_id: userId, meta_key: "wp_user_level", meta_value: "0" },
      { user_id: userId, meta_key: "dismissed_wp_pointers", meta_value: "" },
      {
        user_id: userId,
        meta_key: "last_update",
        meta_value: Math.floor(Date.now() / 1000).toString(),
      },
      { user_id: userId, meta_key: "phone", meta_value: data.phone }, // Add phone to user metadata
    ];

    // Add billing information if provided
    if (data.billing) {
      userMetaData.push(
        {
          user_id: userId,
          meta_key: "billing_first_name",
          meta_value: data.billing.firstName || data.firstName,
        },
        {
          user_id: userId,
          meta_key: "billing_last_name",
          meta_value: data.billing.lastName || data.lastName,
        },
        {
          user_id: userId,
          meta_key: "billing_company",
          meta_value: data.billing.company || "",
        },
        {
          user_id: userId,
          meta_key: "billing_address_1",
          meta_value: data.billing.address1 || "",
        },
        {
          user_id: userId,
          meta_key: "billing_address_2",
          meta_value: data.billing.address2 || "",
        },
        {
          user_id: userId,
          meta_key: "billing_city",
          meta_value: data.billing.city || "",
        },
        {
          user_id: userId,
          meta_key: "billing_state",
          meta_value: data.billing.state || "",
        },
        {
          user_id: userId,
          meta_key: "billing_postcode",
          meta_value: data.billing.postcode || "",
        },
        {
          user_id: userId,
          meta_key: "billing_country",
          meta_value: data.billing.country || "",
        },
        {
          user_id: userId,
          meta_key: "billing_phone",
          meta_value: data.billing.phone || data.phone,
        }, // Use provided billing phone or fall back to main phone
        {
          user_id: userId,
          meta_key: "billing_email",
          meta_value: data.email,
        },
      );
    } else {
      // If no billing info is provided, still add the phone number to billing
      userMetaData.push(
        {
          user_id: userId,
          meta_key: "billing_phone",
          meta_value: data.phone,
        },
        {
          user_id: userId,
          meta_key: "billing_email",
          meta_value: data.email,
        },
      );
    }

    // Add shipping information if provided
    if (data.shipping) {
      userMetaData.push(
        {
          user_id: userId,
          meta_key: "shipping_first_name",
          meta_value: data.shipping.firstName || data.firstName,
        },
        {
          user_id: userId,
          meta_key: "shipping_last_name",
          meta_value: data.shipping.lastName || data.lastName,
        },
        {
          user_id: userId,
          meta_key: "shipping_company",
          meta_value: data.shipping.company || "",
        },
        {
          user_id: userId,
          meta_key: "shipping_address_1",
          meta_value: data.shipping.address1 || "",
        },
        {
          user_id: userId,
          meta_key: "shipping_address_2",
          meta_value: data.shipping.address2 || "",
        },
        {
          user_id: userId,
          meta_key: "shipping_city",
          meta_value: data.shipping.city || "",
        },
        {
          user_id: userId,
          meta_key: "shipping_state",
          meta_value: data.shipping.state || "",
        },
        {
          user_id: userId,
          meta_key: "shipping_postcode",
          meta_value: data.shipping.postcode || "",
        },
        {
          user_id: userId,
          meta_key: "shipping_country",
          meta_value: data.shipping.country || "",
        },
      );
    }

    // Add all metadata in a single batch
    await tx.wp_usermeta.createMany({
      data: userMetaData,
    });

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
        country: data.billing?.country || "",
        postcode: data.billing?.postcode || "",
        city: data.billing?.city || "",
        state: data.billing?.state || "",
      },
    });

    // 4. Initialize empty shopping cart
    await tx.wp_usermeta.create({
      data: {
        user_id: userId,
        meta_key: "_woocommerce_persistent_cart_1",
        meta_value: 'a:1:{s:4:"cart";a:0:{}}',
      },
    });

    // 5. Update user count in wp_options
    const userCount = await tx.wp_users.count();
    await tx.wp_options.update({
      where: { option_name: "user_count" },
      data: { option_value: userCount.toString() },
    });

    // Return customer data
    return {
      id: userId.toString(),
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: `${data.firstName} ${data.lastName}`,
      phone: data.phone,
    };
  });
} 