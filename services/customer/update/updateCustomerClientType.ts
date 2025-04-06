import { prisma } from "@/lib/prisma";

/**
 * Updates a customer's client_type in WordPress
 * @param id - The customer's ID
 * @param clientType - The new client type (great, good, or bad)
 * @returns The updated customer data
 */
export async function updateCustomerClientType(
  id: string, 
  clientType: "great" | "good" | "bad"
) {
  const userId = BigInt(id);
  
  // Check if user exists
  const user = await prisma.wp_users.findUnique({
    where: { ID: userId },
  });
  
  if (!user) {
    throw new Error("Customer not found");
  }
  
  // Update the client_type field
  const updatedUser = await prisma.wp_users.update({
    where: { ID: userId },
    data: { client_type: clientType },
  });
  
  // Get customer metadata from wp_usermeta
  const userMeta = await prisma.wp_usermeta.findMany({
    where: { user_id: userId },
  });

  // Convert metadata array to object for easier access
  const metaObj: Record<string, string> = {};
  userMeta.forEach((meta) => {
    if (meta.meta_key && meta.meta_value) {
      metaObj[meta.meta_key] = meta.meta_value;
    }
  });

  // Get WooCommerce customer data
  const wooCustomer = await prisma.wp_wc_customer_lookup.findFirst({
    where: { user_id: userId },
  });
  
  // Return the user data in the same format as fetchCustomerById
  return {
    id: updatedUser.ID.toString(),
    username: updatedUser.user_login,
    email: updatedUser.user_email,
    displayName: updatedUser.display_name,
    firstName: metaObj["first_name"] || "",
    lastName: metaObj["last_name"] || "",
    phone: updatedUser.phone || metaObj["phone"] || metaObj["billing_phone"] || "",
    client_type: updatedUser.client_type,
    dateRegistered: updatedUser.user_registered,
    lastActive: wooCustomer?.date_last_active || null,
  };
} 