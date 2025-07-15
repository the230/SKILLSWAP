import { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero section */}
        <div className="bg-white">
          <div className="relative">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100"></div>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
                <div className="absolute inset-0">
                  <img className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80" alt="People working on laptops" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-600 mix-blend-multiply"></div>
                </div>
                <div className="relative px-4 py-16 sm:px-6 sm:py-20 lg:py-24 lg:px-8">
                  <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                    <span className="block text-white font-heading">Learn and Teach Skills</span>
                    <span className="block text-primary-200 font-heading">Start Exchanging Today</span>
                  </h1>
                  <p className="mt-6 max-w-lg mx-auto text-center text-xl text-white sm:max-w-3xl">
                    SkillSwap connects people who want to learn with those who can teach. Find your next skill or share your knowledge with others.
                  </p>
                  <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                    <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                      {!user ? (
                        <Link href="/auth">
                          <Button variant="secondary" size="lg" className="flex w-full">
                            Get started
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/dashboard">
                          <Button variant="secondary" size="lg" className="flex w-full">
                            My Dashboard
                          </Button>
                        </Link>
                      )}
                      <Link href="/explore">
                        <Button variant="default" size="lg" className="flex w-full">
                          Browse skills
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">How It Works</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Exchange skills with others
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                SkillSwap makes it easy to connect with people who have the skills you want to learn, and who want to learn skills you can teach.
              </p>
            </div>

            <div className="mt-20">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Create Your Profile</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Set up your profile and add the skills you can teach and the skills you want to learn.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Find Matches</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Search for users who can teach you what you want to learn, or who want to learn what you can teach.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Exchange Skills</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Request a skill exchange, communicate through our platform, and start learning from each other.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-700">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block text-primary-200">Join SkillSwap today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                {!user ? (
                  <Link href="/auth">
                    <Button variant="default" size="lg" className="bg-white text-primary-700 hover:bg-gray-50">
                      Get started
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <Button variant="default" size="lg" className="bg-white text-primary-700 hover:bg-gray-50">
                      Go to Dashboard
                    </Button>
                  </Link>
                )}
              </div>
              <div className="ml-3 inline-flex rounded-md shadow">
                <Link href="/explore">
                  <Button variant="outline" size="lg" className="text-white border-white hover:bg-primary-600">
                    Explore Skills
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
