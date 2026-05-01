import type { Notification } from "@/app/generated/prisma/client";
import { CardContent } from "@/components/ui/card";
import { ShoppingBag, Gift } from "lucide-react";
import { GrArticle } from "react-icons/gr";
import { FaStore, FaUserShield } from "react-icons/fa";
import { BiUser } from "react-icons/bi";
import { IoMdMail } from "react-icons/io";

function formatCurrency(amount: number) {
  return "$" + amount.toFixed(2);
}

function getActivityIcon(type: string) {
  switch (type) {
    case "PaymentInit":
    case "PaymentComplete":
    case "PaymentFail":
    case "OrderInit":
    case "OrderComplete":
    case "OrderFail":
      return ShoppingBag;
    case "DonationInit":
    case "DonationComplete":
    case "DonationFail":
      return Gift;
    case "AdminLogin":
    case "AdminCreate":
    case "AdminRoleChange":
    case "AdminPasswordChangeSelf":
    case "AdminPasswordChangeRoot":
    case "AdminProfileChange":
    case "AdminDelete":
      return FaUserShield;
    case "AdminBlogCreate":
    case "AdminBlogDelete":
      return GrArticle;
    case "AdminStoreItemAdd":
    case "AdminStoreItemUpdate":
    case "AdminStoreItemDelete":
      return FaStore;
    case "ContactFormSubmit":
    case "ContributorFormSubmit":
      return IoMdMail;
    default:
      return BiUser;
  }
}

export function RecentActivities({
  recentActivities,
}: {
  recentActivities: Notification[] | undefined;
}) {
  return (
    <CardContent className="w-full">
      <div className="space-y-4">
        {recentActivities?.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">
            No recent activities
          </p>
        ) : (
          recentActivities?.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const message = activity.message || "No details available";

            return (
              <div
                key={`${activity.type}-${activity.id}`}
                className="flex items-center gap-3"
              >
                <div className="p-2 bg-muted tap-text-primary rounded-full shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-sm py-1 font-medium leading-none tap-dark">
                    {message}
                  </p>
                  {activity.amount && activity.amount > 0 && (
                    <p className="text-sm text-muted-foreground tap-dark opacity-70">
                      {formatCurrency(activity.amount)}
                    </p>
                  )}
                </div>

                <div className="text-sm text-muted-foreground whitespace-nowrap tap-dark opacity-60">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </CardContent>
  );
}
