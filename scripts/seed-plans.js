import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  {
    name: 'free',
    displayName: 'Free',
    price: 0,
    maxConversations: 100,
    maxMessages: 1000,
    features: [
      'Up to 100 conversations/month',
      'Up to 1,000 messages/month',
      'Basic chat widget',
      'Standard support',
      'Basic customization'
    ],
    isActive: true
  },
  {
    name: 'starter',
    displayName: 'Starter',
    price: 29,
    maxConversations: 500,
    maxMessages: 5000,
    features: [
      'Up to 500 conversations/month',
      'Up to 5,000 messages/month',
      'Advanced chat widget',
      'Priority support',
      'Full customization',
      'Analytics dashboard',
      'Email notifications'
    ],
    isActive: true
  },
  {
    name: 'professional',
    displayName: 'Professional',
    price: 79,
    maxConversations: 2000,
    maxMessages: 20000,
    features: [
      'Up to 2,000 conversations/month',
      'Up to 20,000 messages/month',
      'Premium chat widget',
      '24/7 support',
      'Advanced customization',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Webhook integrations'
    ],
    isActive: true
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 199,
    maxConversations: -1, // Unlimited
    maxMessages: -1, // Unlimited
    features: [
      'Unlimited conversations',
      'Unlimited messages',
      'Enterprise chat widget',
      'Dedicated support',
      'White-label solution',
      'Advanced analytics',
      'Custom integrations',
      'SLA guarantee',
      'On-premise deployment'
    ],
    isActive: true
  }
];

async function seedPlans() {
  try {
    console.log('🌱 Seeding plans...');
    
    for (const planData of plans) {
      const plan = await prisma.plan.upsert({
        where: { name: planData.name },
        update: planData,
        create: planData
      });
      
      console.log(`✅ Plan "${plan.displayName}" created/updated`);
    }
    
    console.log('🎉 All plans seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPlans();


