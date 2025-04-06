interface TransactionClient {
  wp_comments: {
    create: Function;
  };
}

/**
 * Adds a refund comment to the order
 */
export async function addRefundComment({
  tx,
  orderId,
  content,
  commentType = "order_note",
}: {
  tx: TransactionClient;
  orderId: number | string;
  content: string;
  commentType?: string;
}) {
  return await tx.wp_comments.create({
    data: {
      comment_post_ID: BigInt(orderId),
      comment_author: "WooCommerce",
      comment_author_email: "woocommerce@lesa.smarts.uz",
      comment_author_url: "",
      comment_author_IP: "",
      comment_date: new Date(),
      comment_date_gmt: new Date(),
      comment_content: content,
      comment_karma: 0,
      comment_approved: "1",
      comment_agent: "WooCommerce",
      comment_type: commentType,
      comment_parent: BigInt(0),
      user_id: BigInt(0),
    },
  });
} 